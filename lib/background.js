'use strict'

const defOpt = { path: '', script: 'https://gist.githubusercontent.com/ACK72/bffd39b58a93e4c3f9545f9d51316bad/raw/lolgg.min.js', debug: false, reference: { 'ARAM': 'LoLalytics', 'URF': 'LoLalytics', 'PORO': 'LoLalytics', 'OFA': 'LoLalytics', 'NEXUS': 'LoLalytics', 'ULT': 'LoLalytics', 'RANK': 'DEEPLOL' }, multiSearch: 'DEEPLOL', setItem: true, setRune: true, setSpell: true, setFlashOnF: true, setSmiteOnF: false, lolalyticsTier: 'platinum_plus', lolalyticsRegion: 'global', lolalyticsItemParsingOffset: 9, lolpsTier: 2, useHWRB: true, updateFrequency: 1000 }
const region = { 'KR': 'www', 'JP': 'jp', 'NA': 'na', 'EUW': 'euw', 'EUNE': 'eune', 'OCE': 'oce', 'BR': 'br', 'LAS': 'las', 'LAN': 'lan', 'RU': 'ru', 'TR': 'tr', 'SG': 'sg', 'ID': 'id', 'PH': 'ph', 'TW': 'tw', 'VN': 'vn', 'TH': 'th', 'LA1': 'lan', 'LA2': 'las', 'OC1': 'oce' }

let client = { reference: 0, statistics: 0 }
let option = {}
let contextTitle = {}

chrome.storage.local.get(defOpt, (result) => {
	option = result
	updateDeprecated(false)
	if (option.path === '') {
		chrome.runtime.getPlatformInfo((info) => {
			option.path = info.os === 'win' ? 'C:/Riot Games/League of Legends' : '/Applications/League of Legends.app/Contents/LoL'
			chrome.storage.local.set(option)
		})
	} else { chrome.storage.local.set(option) }
	setContextMenus()
})

const updateDeprecated = (update=true) => {
	// 1.21.9.0
	if (option.multiSearch === true) option.multiSearch = 'OP.GG'
	if (update) updateOption()
}

const updateOption = (reset=false) => {
	if (reset) option = defOpt
	chrome.storage.local.set(option)
}

const setContextMenus = () => {
	contextTitle.flash = option.setFlashOnF ? 'Set Flash on D' : 'Set Flash on F'
	contextTitle.smite = option.setSmiteOnF ? 'Set Smite on D' : 'Set Smite on F'
	contextTitle.reference = option.reference.RANK === 'LoLalytics' ? 'Use LOL.PS Build' : 'Use LoLalytics Build'
	contextTitle.build = option.useHWRB ? 'Use Most Common Build' : 'Use Highest Win Rate Build'
	chrome.contextMenus.create({ title: 'Update', contexts: ['browser_action'], onclick: () => { chrome.tabs.query({ active: true, currentWindow: true }, (tab) => { if(tab[0]) syncDataWithClient(tab[0].id, true) }) } })
	chrome.contextMenus.create({ title: 'Match History', contexts: ['browser_action'], onclick: () => {	if (client.summoner) chrome.tabs.create({ url: 'https://www.op.gg/summoner/userName=' + client.summoner.displayName }) } })
	chrome.contextMenus.create({ title: contextTitle.flash, id: 'flash', contexts: ['browser_action'], onclick: () => {
		option.setFlashOnF = !option.setFlashOnF
		if (client.cid) client.update = 0
		chrome.storage.local.set(option)
		contextTitle.flash = option.setFlashOnF ? 'Set Flash on D' : 'Set Flash on F'
		chrome.contextMenus.update('flash', { title: contextTitle.flash })
	} })
	chrome.contextMenus.create({ title: contextTitle.smite, id: 'smite', contexts: ['browser_action'], onclick: () => {
		option.setSmiteOnF = !option.setSmiteOnF
		if (client.cid) client.update = 0
		chrome.storage.local.set(option)
		contextTitle.smite = option.setSmiteOnF ? 'Set Smite on D' : 'Set Smite on F'
		chrome.contextMenus.update('smite', { title: contextTitle.smite })
	} })
	chrome.contextMenus.create({ title: contextTitle.reference, id: 'reference', contexts: ['browser_action'], onclick: () => {
		option.reference.RANK = option.reference.RANK === 'LoLalytics' ? 'LOL.PS' : 'LoLalytics'
		client.cid = 0
		client.newpick = true
		chrome.storage.local.set(option)
		contextTitle.reference = option.reference.RANK === 'LoLalytics' ? 'Use LOL.PS Build' : 'Use LoLalytics Build'
		chrome.contextMenus.update('reference', { title: contextTitle.reference })
	} })
	chrome.contextMenus.create({ title: contextTitle.build, id: 'build', contexts: ['browser_action'], onclick: () => {
		option.useHWRB = !option.useHWRB
		if (client.cid) client.update = 0
		chrome.storage.local.set(option)
		contextTitle.build = option.useHWRB ? 'Use Most Common Build' : 'Use Highest Win Rate Build'
		chrome.contextMenus.update('build', { title: contextTitle.build })
	} })
}

const requestURL = (url, riot=false, method='GET', data={}) => {
	const xhr = new XMLHttpRequest()
	return new Promise(function (resolve, reject) {
		xhr.onreadystatechange = function () {
			if (xhr.readyState !== 4) return
			if (xhr.response.length > 0) resolve(xhr.response)
			else reject(JSON.stringify({ status: xhr.status, statusText: xhr.statusText }))
		}
		if (riot) xhr.open(method, 'https://riot:'+client.password+'@127.0.0.1:'+client.port+url, true)
		else xhr.open(method, url, true)
		if (method === 'PUT' || method === 'POST' || method === 'PATCH') xhr.setRequestHeader('Content-type', 'application/json')
		if (Object.keys(data).length) xhr.send(JSON.stringify(data))
		else xhr.send()
	})
}

const fetchURL = (url, key=false, method='GET', data={}) => {
	requestURL(url, true, method, data)
	.then((response) => {
		if (key) {
			let json = JSON.parse(response)
			if (typeof json.errorCode === 'undefined') client[key] = json
			else client[key] = undefined
		}
	})
	.catch((error) => {
		client[key] = undefined
		if (key === 'locale' && client.live && error.includes('"status":0')) chrome.storage.local.set({ error: true })
	})
}

const readLockFile = () => {
	const url = 'file://'+option.path+'/lockfile'
	requestURL(url)
	.then((lockfile) => {
		let data = lockfile.split(':')
		client.live = true
		client.port = data[2]
		client.password = data[3]
	})
	.catch(() => { client = { reference: 0, statistics: 0 } })
}

const findLockFile = () => {
	if (!option.path) return
	const url = 'file://'+option.path+'/'
	requestURL(url)
	.then((lockfile) => {
		client.error = false
		if (lockfile.indexOf('lockfile') > 0) readLockFile()
		else client = { reference: 0, statistics: 0 }
	})
	.catch(() => { chrome.storage.local.set({ error: true }) })
}

const onSession = () => {
	fetchURL('/lol-champ-select/v1/session', 'session')

	if (!client.session) {
		client.playerstatus = undefined
		client.queueType = undefined
		client.pid = undefined
		client.cid = undefined
		client.championId = undefined
		client.championName = undefined
		client.mutex = true
		client.newpick = true
		client.newteam = true
		client.update = 1
		for (let i=0;i<5;i++) client['summoner'+i] = undefined
		return
	}

	if (!client.playerstatus) {
		fetchURL('/lol-gameflow/v1/gameflow-metadata/player-status', 'playerstatus')
		return
	}

	if (client.pid === undefined) {
		for (let i = 0;i < client.session.myTeam.length;i++) { if (client.session.myTeam[i].summonerId === client.summoner.summonerId) client.pid = i }
		client.lane = client.session.myTeam[client.pid].assignedPosition === 'utility' ? 'support' : client.session.myTeam[client.pid].assignedPosition
	}

	if (client.mutex) {
		client.mutex = false

		const pathname = { 'LoLalytics': { 'ARAM': 'aram/', 'URF': 'urf/', 'PORO': 'poro/', 'OFA': 'ofa/', 'NEXUS': 'nexus/', 'ULT': 'ultimatespellbook/', 'RANK': '' } }
		const queue = { 450: 'ARAM', 900: 'URF', 920: 'PORO', 1020: 'OFA', 1300: 'NEXUS', 1400: 'ULT' }
		const laneMap = { 'top': 0, 'jungle': 1, 'middle': 2, 'bottom': 3, 'support': 4 }

		let rurl = ''
		let cid = client.session.myTeam[client.pid].championId > 0 ? client.session.myTeam[client.pid].championId : client.session.myTeam[client.pid].championPickIntent

		client.newpick = (client.newpick && (client.cid === undefined || client.cid === 0)) || client.cid !== cid
		client.cid = cid
		client.queueType = client.playerstatus.currentLobbyStatus.queueId in queue ? queue[client.playerstatus.currentLobbyStatus.queueId] : 'RANK'

		switch (option.reference[client.queueType]) {
			case 'LOL.PS':
				if (client.cid) rurl = client.lane === '' ? 'https://lol.ps/champ/' + client.cid + '/statistics/?tier=' + option.lolpsTier : 'https://lol.ps/champ/' + client.cid + '/statistics/?lane=' + laneMap[client.lane] + '&tier=' + option.lolpsTier
				else rurl = 'https://lol.ps/statistics/'
				break
            case 'DEEPLOL':
                if (client.cid) rurl = client.lane === '' ? 'https://lol.ps/champ/' + client.cid + '/statistics/?tier=' + option.lolpsTier : 'https://lol.ps/champ/' + client.cid + '/statistics/?lane=' + laneMap[client.lane] + '&tier=' + option.lolpsTier
                else rurl = 'https://www.deeplol.gg/champions'
                break
			case 'LoLalytics':
			default:
				if (client.queueType === 'RANK') {
					if (client.cid) rurl = client.lane === '' ? 'https://lolalytics.com/lol/' + client.champions[client.cid][0] +'/' + pathname[option.reference[client.queueType]][client.queueType] + 'build/?tier=' + option.lolalyticsTier + '&region=' + option.lolalyticsRegion : 'https://lolalytics.com/lol/' + client.champions[client.cid][0] +'/' + pathname[option.reference[client.queueType]][client.queueType] + 'build/?lane=' + client.lane + '&tier=' + option.lolalyticsTier + '&region=' + option.lolalyticsRegion
					else rurl = 'https://lolalytics.com/lol/tierlist/' + pathname[option.reference[client.queueType]][client.queueType] + '?lane=' + client.lane + '&tier=' + option.lolalyticsTier + '&region=' + option.lolalyticsRegion
				} else {
					if (client.cid) rurl = 'https://lolalytics.com/lol/' + client.champions[client.cid][0] +'/' + pathname[option.reference[client.queueType]][client.queueType] + 'build/?tier=' + option.lolalyticsTier + '&region=' + option.lolalyticsRegion
					else rurl = 'https://lolalytics.com/lol/tierlist/' + pathname[option.reference[client.queueType]][client.queueType] + '?tier=' + option.lolalyticsTier + '&region=' + option.lolalyticsRegion
				}
		}
		if (client.cid) {
			client.championId = client.champions[client.cid][0]
			client.championName = client.champions[client.cid][1]
		}

		if (client.newpick) {
			chrome.tabs.get(client.reference, (tab) => {
                if (tab === undefined || (!tab.url.includes('lol.ps') && !tab.url.includes('lolalytics.com') && !tab.url.includes('deeplol.gg'))) {
					chrome.tabs.create({ url: rurl }, async (tab) => {
						chrome.tabs.onUpdated.addListener(function ulistener (id, info) {
							if (info.status === 'complete' && id === tab.id) {
								chrome.tabs.onUpdated.removeListener(ulistener)
								if (client.cid) client.update = 0
								client.reference = tab.id
								client.mutex = true
								client.newpick = false
							}
						})
						chrome.tabs.onRemoved.addListener(function rlistener (id, info) {
							if (id === tab.id) {
								chrome.tabs.onRemoved.removeListener(rlistener)
								client.mutex = true
								client.cid = 0
								client.newpick = true
							}
						})
					})
				} else {
					chrome.tabs.update(client.reference, { url: rurl, active: true, highlighted: true }, async (tab) => {
						chrome.tabs.onUpdated.addListener(function ulistener (id, info) {
							if (info.status === 'complete' && id === tab.id) {
								chrome.tabs.onUpdated.removeListener(ulistener)
								if (client.cid) client.update = 0
								client.reference = tab.id
								client.mutex = true
								client.newpick = false
							}
						})
					})
				}
			})
		} else {
			client.mutex = true
		}
	}

	if (option.multiSearch && client.newteam && client.queueType === 'RANK') {
		client.newteam = false

		for (let i = 0;i < client.session.myTeam.length;i++) {
			fetchURL('/lol-summoner/v1/summoners/'+client.session.myTeam[i].summonerId, 'summoner'+i)
		}

		let murl = ''
		if (option.multiSearch === 'OP.GG') murl = 'https://'+region[client.locale.region]+'.op.gg/multi/query='
		else if (option.multiSearch === 'YOUR.GG') murl = region[client.locale.region] === 'www' ? 'https://your.gg/kr/ai/multisearch/result?text=' : 'https://your.gg/'+region[client.locale.region]+'/ai/multisearch/result?text='
        else if (option.multiSearch === 'DEEPLOL') murl = region[client.locale.region] === 'www' ? 'https://www.deeplol.gg/multi/KR/' : 'https://www.deeplol.gg/multi/'+region[client.locale.region]+'/'

		for (let i = 0;i < client.session.myTeam.length;i++) {
			if (!client['summoner'+i]) {
				client.newteam = true
				return
			} else {
				if (i !== 0) murl += ','
				murl += client['summoner'+i].internalName
			}
		}

		chrome.tabs.get(client.statistics, (tab) => {
			if (tab === undefined || (!tab.url.includes('op.gg') && !tab.url.includes('your.gg') && !tab.url.includes('deeplol.gg'))) {
				chrome.tabs.create({ url: murl }, async (tab) => {
					chrome.tabs.onUpdated.addListener(function ulistener (id, info) {
						if (info.status === 'complete' && id === tab.id) {
							chrome.tabs.onUpdated.removeListener(ulistener)
							client.statistics = tab.id
						}
					})
				})
			} else {
				chrome.tabs.update(client.statistics, { url: murl, active: true, highlighted: true }, async (tab) => {
					chrome.tabs.onUpdated.addListener(function ulistener (id, info) {
						if (info.status === 'complete' && id === tab.id) {
							chrome.tabs.onUpdated.removeListener(ulistener)
							client.statistics = tab.id
						}
					})
				})
			}
		})
	}
}

const syncDataWithClient = (tabId, force=false) => {
	chrome.tabs.executeScript(tabId, { code: client.script }, () => {
		chrome.tabs.sendMessage(tabId, { query: 'parse', queueType: client.queueType, cid: client.cid, championId: client.championId, championName: client.championName, option: option, force: force }, (data) => {
			if (option.debug) console.log(data)
			if (typeof data === 'undefined' || data === null) return
			if (!force && !data.integrity) return
			if (!force && client.update !== 0) return
			if (data.unsupported) return
			if (data.error) return
			client.update = 2

			if (option.setSpell) fetchURL('/lol-champ-select/v1/session/my-selection', false, 'PATCH', data.spell)
			if (option.setRune) {
				requestURL('/lol-perks/v1/pages', true)
				.then((response) => {
					let rid = 0
					let runes = JSON.parse(response)
					if (runes.length < 7) {
						fetchURL('/lol-perks/v1/pages', false, 'POST', data.rune)
					} else {
						for (let i = 0;i < runes.length;i++) {
							if (runes[i]['name'].includes('LOL.PS') || runes[i]['name'].includes('LoLalytics')) {
								rid = runes[i]['id']
								break
							}
							if (rid === 0 && runes[i]['current'] && runes[i]['isEditable']) rid = runes[i]['id']
						}
						if (rid !== 0) {
							requestURL('/lol-perks/v1/pages/'+rid, true, 'DELETE')
							.catch((response) => { if (response.includes('204')) fetchURL('/lol-perks/v1/pages', false, 'POST', data.rune) })
						}
					}
				})
			}
			if (option.setItem) {
				requestURL('/lol-item-sets/v1/item-sets/'+client.summoner.summonerId+'/sets', true)
				.then((response) => {
					let items = JSON.parse(response)
					let patch = false

					if (Object.keys(items['itemSets']).length === 0) {
						patch = true
						items['itemSets'].push(data.item)
					} else {
						for (let i = 0;i < Object.keys(items['itemSets']).length;i++) {
							if (items['itemSets'][i]['title'] === data.item['title']) {
								patch = true
								items['itemSets'][i] = data.item
							}
						}
					}
					if (!patch) items['itemSets'].push(data.item)
					fetchURL('/lol-item-sets/v1/item-sets/'+client.summoner.summonerId+'/sets', false, 'PUT', items)
				})
			}
		})
	})
}

let main = () => {
	findLockFile()
	if (client.live) {
		if (!client.script) {
			requestURL(option.script)
			.then((response) => { client.script = response })
		} else if (!client.summoner || !client.locale) {
			fetchURL('/riotclient/region-locale', 'locale')
			fetchURL('/lol-summoner/v1/current-summoner', 'summoner')
		} else if (!client.version) {
			requestURL('https://ddragon.leagueoflegends.com/api/versions.json')
			.then((response) => { client.version = JSON.parse(response)[0] })
			.catch(() => { client.version = '11.1.1' })
		} else if (!client.champions || Object.keys(client.champions).length === 0) {
			requestURL('https://ddragon.leagueoflegends.com/cdn/'+client.version+'/data/'+client.locale.locale+'/champion.json')
			.then((response) => {
				let data = JSON.parse(response).data
				client.champions = {}

				for(let key in data) {
					let championId = key.toLowerCase()
					if (championId === 'monkeyking') championId = 'wukong'
					client.champions[data[key].key] = [ championId, data[key].name ]
				}
			})
			.catch()
		} else {
			onSession()
			if (!client.update) syncDataWithClient(client.reference)
		}
	}
	setTimeout(main, option.updateFrequency)
}
setTimeout(main, option.updateFrequency)