'use strict'

let path = false
let multi = true
let flash = true
let smite = false
let tnr = false
let tier = [9, '']
let region = [0, '']
let disabled = false
let client = { live: false, summoner: false, lolalytics: 0, opgg: 0 }

let regionMap = {
	'KR': 'www',
	'JP': 'jp',
	'NA': 'na',
	'EUW': 'euw',
	'EUNE': 'eune',
	'OCE': 'oce',
	'BR': 'br',
	'LAS': 'las',
	'LAN': 'lan',
	'RU': 'ru',
	'TR': 'tr',
	'SG': 'sg',
	'ID': 'id',
	'PH': 'ph',
	'TW': 'tw',
	'VN': 'vn',
	'TH': 'th',
	'LA1': 'lan',
	'LA2': 'las',
	'OC1': 'oce'
}

chrome.runtime.onInstalled.addListener(() => { chrome.storage.local.set({ multi: multi, flash: flash, smite: smite, tnr: tnr, tier: tier, region: region, disabled: disabled }) })
chrome.storage.local.get('multi', (result) => { multi = result.multi })
chrome.storage.local.get('flash', (result) => { flash = result.flash })
chrome.storage.local.get('smite', (result) => { smite = result.smite })
chrome.storage.local.get('tnr', (result) => { tnr = result.tnr })
chrome.storage.local.get('tier', (result) => { tier = result.tier })
chrome.storage.local.get('region', (result) => { region = result.region })
chrome.storage.local.get('disabled', (result) => { disabled = result.disabled })

chrome.runtime.getPlatformInfo((info) => {
	chrome.storage.local.get('path', (result) => {
		if (!result.path) {
			const defaultPath = info.os === 'win' ? 'C:/Riot Games/League of Legends' : '/Applications/League of Legends.app/Contents/LoL'
			chrome.storage.local.set({ path: defaultPath })
			path = defaultPath
		} else path = result.path
	})
})

const resetClient = () => { client = { live: false, summoner: false, lolalytics: 0, opgg: 0 } }

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
		client.success = true
		if (key) {
			let json = JSON.parse(response)
			if (typeof json.errorCode === 'undefined') client[key] = json
			else client[key] = false
		}
	})
	.catch((error) => {
		client.success = false
		client[key] = false
		if (key === 'locale' && client.live && error.includes('"status":0')) client.error = true
	})
}

const readLockFile = () => {
	if (!path) return
	const url = 'file://'+path+'/lockfile'
	requestURL(url)
	.then((lockfile) => {
		let lockData = lockfile.split(':')
		client.live = true
		client.port = lockData[2]
		client.password = lockData[3]
	})
	.catch((error) => { resetClient() })
}

const findLockFile = () => {
	if (!path) return
	const url = 'file://'+path+'/'
	requestURL(url)
	.then((lockfile) => {
		client.error = false
		if (lockfile.indexOf('lockfile') > 0) readLockFile()
		else resetClient()
	})
	.catch((error) => {
		client.error = true
	})
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
	if (request.query === 'summoner') {
		let info = {
			name: client.summoner ? client.summoner.displayName : false,
			summoner: client.summoner ? client.summoner.internalName : false,
			icon: client.summoner ? client.summoner.profileIconId : 0,
			region: client.locale ? regionMap[client.locale.region] : '',
			error: (!client.success && client.error) ? true : false,
			version: client.version ? client.version : '11.1.1',
			path: path,
			tnr: tnr,
			tierIndex: tier[0],
			regionIndex: region[0],
			update: client.update,
			disabled: disabled
		}
		sendResponse(info)
		return true
	}

	if (request.query === 'request') {
		sendMessageToCurrentTab({ query: 'copy' }, (web) => {
			if (web === undefined) return
			if (web.cid != client.cid) return
			if (web.insufficient) {
				client.update = 2
				return
			}
			if (web.spell.length !== 2 && web.rune.length !== 9) return

			updatePage(web, true)
		})
		return true
	}

	if (multi === undefined) multi = true
	if (flash === undefined) flash = true
	if (smite === undefined) smite = false
	if (tnr === undefined) tnr = false
	if (tier === undefined) tier = [9, '']
	if (region === undefined) region  = [0, '']
	if (disabled === undefined) disabled = false

	if (request.query === 'getmulti') {
		sendResponse(multi)
		return true
	}
	if (request.query === 'getflash') {
		sendResponse([flash, flash === smite])
		return true
	}
	if (request.query === 'getsmite') {
		sendResponse([smite, flash === smite])
		return true
	}
	if (request.query === 'getctnr') {
		sendResponse([tnr, tier[0], region[0]])
		return true
	}
	if (request.query === 'getdisabled') {
		sendResponse(disabled)
		return true
	}

	if (request.query === 'togglemulti') {
		multi = !multi
		chrome.storage.local.set({ multi: multi })
		sendResponse(multi)
		return true
	}
	if (request.query === 'toggleflash') {
		flash = !flash
		chrome.storage.local.set({ flash: flash })
		sendResponse([flash, flash === smite])
		return true
	}
	if (request.query === 'togglesmite') {
		smite = !smite
		chrome.storage.local.set({ smite: smite })
		sendResponse([smite, flash === smite])
		return true
	}
	if (request.query === 'togglectnr') {
		tnr = !tnr
		chrome.storage.local.set({ tnr: tnr })
		if (!tnr) {
			tier = [9, '']
			region = [0, '']
			chrome.storage.local.set({ tier: tier, region: region })
		}
		sendResponse([tnr, tier[0], region[0]])
		return true
	}
	if (request.query === 'toggledisabled') {
		disabled = !disabled
		chrome.storage.local.set({ disabled: disabled })
		sendResponse(disabled)
		return true
	}

	if (request.query === 'settier') {
		tier = request.value
		client.queueId = undefined
		client.tierlist = undefined
		client.cid = undefined
		chrome.storage.local.set({ tier: tier })
		return true
	}
	if (request.query === 'setregion') {
		region = request.value
		client.queueId = undefined
		client.tierlist = undefined
		client.cid = undefined
		chrome.storage.local.set({ region: region })
		return true
	}

	if (request.query === 'setpath') {
		path = request.path
		chrome.storage.local.set({ path: path })
		client.error = false
		return true
	}
})

const onSession = () => {
	if (!client.summoner) return

	fetchURL('/lol-champ-select/v1/session', 'session')
	if (!client.session) {
		client.playerstatus = undefined
		client.cid = undefined
		client.pid = undefined
		client.queueId = undefined
		client.assigned = true
		client.newpick = true
		client.update = 1

		if (multi) {
			client.newteam = true
			for (let i=0;i<5;i++) client['summoner'+i] = undefined
		}

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

	if (client.queueId === undefined) {
		client.queueId = client.playerstatus.currentLobbyStatus.queueId

		client.query = ''
		// https://static.developer.riotgames.com/docs/lol/queues.json
		switch (client.queueId) {
			case 100:
			case 450:
				client.tierlist = true
				client.queue = 'aram/'
				client.suffix = ' ARAM'
				break
			case 900:
				client.queue = 'urf/'
				client.suffix = ' URF'
				break
			case 920:
				client.queue = 'poro/'
				client.suffix = ' PORO'
				break
			case 1020:
				client.queue = 'oneforall/'
				client.suffix = ' OFA'
				break
			case 1300:
				client.queue = 'nexus/'
				client.suffix = ' NEXUS'
				break
			default:
				client.queue = ''
				client.suffix = ''
				client.query = client.lane.trim().length === 0 ? '' : '?lane='+client.lane
				break
		}
		client.query += tier[1].length === 0 ? tier[1] : client.query.length === 0 ? '?tier='+tier[1] : '&tier='+tier[1]
		client.query += region[1].length === 0 ? region[1] : client.query.length === 0 ? '?region='+region[1] : '&region='+region[1]
	}
	
	if (client.assigned) {
		client.assigned = false

		let cid = client.session.myTeam[client.pid].championId > 0 ? client.session.myTeam[client.pid].championId : client.session.myTeam[client.pid].championPickIntent

		client.newpick = (client.newpick && client.cid === undefined) || client.cid !== cid
		client.cid = cid
		if (client.cid) client.page = 'LoLalytics - ' + client.pool[client.cid][1] + client.suffix

		let lurl = ''
		if (client.cid === 0) lurl = 'https://lolalytics.com/lol/tierlist/'+client.queue+client.query
		else lurl = 'https://lolalytics.com/lol/'+client.pool[client.cid][0]+'/'+client.queue+'build/'+client.query

		if (client.newpick) {
			chrome.tabs.get(client.lolalytics, (tab) => {
				if (tab === undefined || !tab.url.includes('lolalytics.com')) {
					chrome.tabs.create({ url: lurl }, async (tab) => {
						chrome.tabs.onUpdated.addListener(function ulistener (id, info) {
							if (info.status === 'complete' && id === tab.id) {
								chrome.tabs.onUpdated.removeListener(ulistener)
								if (client.cid) client.update = 0
								client.lolalytics = tab.id
								client.assigned = true
								client.newpick = false
							}
						})
						chrome.tabs.onRemoved.addListener(function rlistener (id, info) {
							if (id === tab.id) {
								chrome.tabs.onRemoved.removeListener(rlistener)
								client.assigned = true
								client.newpick = true
							}
						})
					})
				} else {
					chrome.tabs.update(client.lolalytics, { url: lurl, active: true, highlighted: true }, async (tab) => {
						chrome.tabs.onUpdated.addListener(function ulistener (id, info) {
							if (info.status === 'complete' && id === tab.id) {
								chrome.tabs.onUpdated.removeListener(ulistener)
								if (client.cid) client.update = 0
								client.lolalytics = tab.id
								client.assigned = true
								client.newpick = false
							}
						})
					})
				}
			})
		} else {
			client.assigned = true
		}
	}

	if (multi && client.newteam) {
		client.newteam = false

		for (let i = 0;i < client.session.myTeam.length;i++) {
			fetchURL('/lol-summoner/v1/summoners/'+client.session.myTeam[i].summonerId, 'summoner'+i)
		}

		let ourl = 'https://'+regionMap[client.locale.region]+'.op.gg/multi/query='

		for (let i = 0;i < client.session.myTeam.length;i++) {
			if (!client['summoner'+i]) {
				client.newteam = true
				return
			} else {
				if (i !== 0) ourl += ','
				ourl += client['summoner'+i].internalName
			}
		}

		chrome.tabs.get(client.opgg, (tab) => {
			if (tab === undefined || !tab.url.includes('op.gg')) {
				chrome.tabs.create({ url: ourl }, async (tab) => {
					chrome.tabs.onUpdated.addListener(function ulistener (id, info) {
						if (info.status === 'complete' && id === tab.id) {
							chrome.tabs.onUpdated.removeListener(ulistener)
							client.opgg = tab.id
						}
					})
				})
			} else {
				chrome.tabs.update(client.opgg, { url: ourl, active: true, highlighted: true }, async (tab) => {
					chrome.tabs.onUpdated.addListener(function ulistener (id, info) {
						if (info.status === 'complete' && id === tab.id) {
							chrome.tabs.onUpdated.removeListener(ulistener)
							client.opgg = tab.id
						}
					})
				})
			}
		})
	}
}

const getUid = () => {
	const n4 = () => { return Math.floor((1 + Math.random()) * 0x7fff).toString(16) }
	return n4() + n4() + '-' + n4() + '-' + n4() + '-' + n4() + '-' + n4() + n4() + n4()
}

const updatePage = (data, force=false) => {
	if (!force && client.update !== 0) return
	// if (force && client.update !== 2) return // force is only true when client.update === 2
	client.update = 2

	// spell
	// flash: 4 <<< smite: 11
	let sdata = { spell1Id: 0, spell2Id: 0 }
	if (data.spell[0] === 11 || data.spell[1] === 11) {
		if (smite) {
			sdata.spell1Id = data.spell[0] + data.spell[1] - 11
			sdata.spell2Id = 11
		} else {
			sdata.spell1Id = 11
			sdata.spell2Id = data.spell[0] + data.spell[1] - 11
		}
	} else if (data.spell[0] === 4 || data.spell[1] === 4) {
		if (flash) {
			sdata.spell1Id = data.spell[0] + data.spell[1] - 4
			sdata.spell2Id = 4
		} else {
			sdata.spell1Id = 4
			sdata.spell2Id = data.spell[0] + data.spell[1] - 4
		}
	} else {
		sdata.spell1Id = data.spell[0]
		sdata.spell2Id = data.spell[1]
	}
	fetchURL('/lol-champ-select/v1/session/my-selection', false, 'PATCH', sdata)

	// rune
	let rid = 0
	let pid = Math.floor(data.rune[0] / 100) * 100
	let sid = Math.floor(data.rune[4] / 100) * 100

	if (pid == 9100) pid = 8000
	if (pid == 9900) pid = 8100
	if (sid == 9100) sid = 8000
	if (sid == 9900) sid = 8100

	let rdata = {
		'autoModifiedSelections': [0],
		'current': true,
		'id': 0,
		'isActive': true,
		'isDeletable': true,
		'isEditable': true,
		'isValid': true,
		'lastModified': 0,
		'name': client.page,
		'order': 0,
		'primaryStyleId': pid,
		'selectedPerkIds': data.rune,
		'subStyleId': sid
	}

	requestURL('/lol-perks/v1/pages', true)
	.then(response => {
		let rpage = JSON.parse(response)
		// rune page: fixed 5 page, default given 2 page
		if (rpage.length < 7) {
			fetchURL('/lol-perks/v1/pages', false, 'POST', rdata)
		} else {	
			for (let i = 0;i < rpage.length;i++) {
				if (rpage[i]['name'].includes('Lolalytics')) {
					rid = rpage[i]['id']
					break
				}
				if (rpage[i]['current'] && rpage[i]['isEditable'] && rid === 0) rid = rpage[i]['id']
			}
			if (rid !== 0) {
				requestURL('/lol-perks/v1/pages/'+rid, true, 'DELETE')
				.then((response) => {})
				.catch((error) => {
					// response 204 404
					if (error.includes('204')) fetchURL('/lol-perks/v1/pages', false, 'POST', rdata)
				})
			}
		}
	})
	.catch((error) => {})

	// item
	if (!data.parseItem) return
	requestURL('/lol-item-sets/v1/item-sets/'+client.summoner.summonerId+'/sets', true)
	.then((response) => {
		let items = JSON.parse(response)

		let itype = [ 'Starting Item', 'Core Item', '4th Item', '5th Item', '6th Item' ]
		let idata = {
			'associatedChampions': [data.cid],
			'associatedMaps': [],
			'blocks': [],
			'map': 'any',
			'mode': 'any',
			'preferredItemSlots': [],
			'sortrank': 0,
			'startedFrom': 'blank',
			'title': 'LoLalytics Itemset',
			'type': 'custom',
			'uid': getUid()
		}

		for (let i = 0;i < 5;i++) {
			if (data.item[i].length === 0) continue
			let block = { items: [], hideIfSummonerSpell: '', showIfSummonerSpell: '', type: itype[i] }
			for (let j = 0;j < data.item[i].length;j++) { block['items'].push({ count: 1, id: data.item[i][j] }) }
			idata['blocks'].push(block)
		}

		let iupdate = false
		if (Object.keys(items['itemSets']).length === 0) {
			items['itemSets'].push(idata)
			iupdate = true
		} else {
			for (let i = 0;i < Object.keys(items['itemSets']).length;i++) {
				if (items['itemSets'][i]['title'] === idata['title']) {
					items['itemSets'][i] = idata
					iupdate = true
				}
			}
		}
		if (!iupdate) items['itemSets'].push(idata)
		fetchURL('/lol-item-sets/v1/item-sets/'+client.summoner.summonerId+'/sets', false, 'PUT', items)
	})
	.catch((error) => {})
}

function sendMessageToCurrentTab() {
	if (!client.lolalytics) return
	let args = Array.prototype.slice.call(arguments)
	args.unshift(client.lolalytics)
	chrome.tabs.sendMessage.apply(this, args)
}

setInterval(() => {
	if (disabled) return
	if (!client.live) return
	if (!client.summoner || !client.locale) {
		fetchURL('/riotclient/region-locale', 'locale')
		fetchURL('/lol-summoner/v1/current-summoner', 'summoner')
		return
	}
	if (!client.version) {
		requestURL('https://ddragon.leagueoflegends.com/api/versions.json')
		.then((response) => { client.version = JSON.parse(response)[0] })
		.catch((error) => { client.version = '11.1.1' })
		return
	}
	if (!client.pool) {
		requestURL('https://ddragon.leagueoflegends.com/cdn/'+client.version+'/data/'+client.locale.locale+'/champion.json')
		.then((response) => {
			let champ = JSON.parse(response).data
			client.pool = {}
			
			for (let x in champ) {
				let champId = champ[x].id.toLowerCase()
				if (champId === 'monkeyking') champId = 'wukong'
				client.pool[champ[x].key] = [ champId, champ[x].name ]
			}
		})
		.catch((error) => {})
		return
	}
	onSession()
	if (!client.update) {
		sendMessageToCurrentTab({ query: 'copy' }, (web) => {
			if (web === undefined) return
			if (web.cid != client.cid) return
			if (web.insufficient) {
				client.update = 2
				return
			}
			if (web.spell.length !== 2 && web.rune.length !== 9) return

			updatePage(web)
		})
	}
}, 1000)

setInterval(() => {
	if (disabled || client.success) return
	findLockFile()
}, 5000)

if (!disabled) setTimeout(() => findLockFile(), 1000)