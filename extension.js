'use strict'

document.getElementById('tier').addEventListener('change', (event) => {
	let tier = document.getElementById('tier')
	chrome.runtime.sendMessage({ query: 'tier', value: [tier.selectedIndex, tier.value] }, (data) => {})
}, false)
document.getElementById('region').addEventListener('change', (event) => {
	let region = document.getElementById('region')
	chrome.runtime.sendMessage({ query: 'region', value: [region.selectedIndex, region.value] }, (data) => {})
}, false)

multicheckbox.onclick = (element) => {
	chrome.runtime.sendMessage({ query: 'multiflash' }, (data) => {
		document.getElementById('flashcheckbox').checked = data
	})
}
flashcheckbox.onclick = (element) => {
	chrome.runtime.sendMessage({ query: 'toggleflash' }, (data) => {
		document.getElementById('flash').innerHTML = 'Set Flash on ' + (data[0] ? 'F key' : 'D key')
		document.getElementById('flashcheckbox').checked = data[0]
		if (data[1]) document.getElementById('override').style.display = 'block'
		else document.getElementById('override').style.display = 'none'
	})
}
smitecheckbox.onclick = (element) => {
	chrome.runtime.sendMessage({ query: 'togglesmite' }, (data) => {
		document.getElementById('smite').innerHTML = 'Set Smite on ' + (data[0] ? 'F key' : 'D key')
		document.getElementById('smitecheckbox').checked = data[0]
		if (data[1]) document.getElementById('override').style.display = 'block'
		else document.getElementById('override').style.display = 'none'
	})
}
ctnrcheckbox.onclick = (element) => {
	chrome.runtime.sendMessage({ query: 'togglectnr' }, (data) => {
		document.getElementById('ctnr').innerHTML = data[0] ? 'Custom Tier&Region' : 'Use PLAT+&GLOBAL'
		document.getElementById('ctnrcheckbox').checked = data[0]
		document.getElementById('tier').selectedIndex = data[1]
		document.getElementById('region').selectedIndex = data[2]
		if (data[0]) document.getElementById('tnrdiv').style.display = 'grid'
		else document.getElementById('tnrdiv').style.display = 'none'
	})
}
disabledcheckbox.onclick = (element) => {
	chrome.runtime.sendMessage({ query: 'toggledisabled' }, (data) => {
		document.getElementById('disabled').innerHTML = 'Extension ' + (data ? 'Disabled' : 'Enabled')
		document.getElementById('disabledcheckbox').checked = !data
	})
}

chrome.runtime.sendMessage({ query: 'summoner' }, data => {
	document.body.style.width = '150px'
	if (data.error) {
		if (data.disabled) return
		document.body.style.width = '205px'
		document.getElementById('summoner').style.display = 'none'
		document.getElementById('error').style.display = 'block'
		document.getElementById('sslerror').style.display = 'block'
		document.getElementById('sslerrorlink').addEventListener('click', () => chrome.tabs.create({ url: 'https://static.developer.riotgames.com/docs/lol/riotgames.pem' }))
		document.getElementById('fileerror').style.display = 'block'
		document.getElementById('fileerrorlink').addEventListener('click', () => chrome.tabs.create({ url: 'edge://extensions/?id='+chrome.runtime.id }))
		document.getElementById('path').value = data.path
		document.getElementById('pathsave').addEventListener('click', () => {
			chrome.runtime.sendMessage(this, { query: 'setpath', path: document.getElementById('path').value })
			let element = document.createElement('div')
			element.innerHTML = 'Path Updated'
			let ref = document.getElementById('pathsave')
			ref.parentNode.insertBefore(element, ref.nextSibling)
			setTimeout(() => window.close(), 1000)
		})
	}
	if (data.summoner) {
		document.getElementById('icon').innerHTML = '<img src="https://ddragon.leagueoflegends.com/cdn/'+data.version+'/img/profileicon/'+data.icon+'.png" width="50" height="50">'
		document.getElementById('profile').innerHTML = data.name
		document.getElementById('stats').innerHTML = 'Match History'
		document.getElementById('stats').addEventListener('click', () => chrome.tabs.create({ url: 'https://'+data.region+'.op.gg/summoner/userName='+data.name.trim() }))
		document.getElementById('multi').style.display = 'block'
		document.getElementById('multidiv').style.display = 'block'
		document.getElementById('flash').style.display = 'block'
		document.getElementById('flashdiv').style.display = 'block'
		document.getElementById('smite').style.display = 'block'
		document.getElementById('smitediv').style.display = 'block'
		document.getElementById('ctnr').style.display = 'block'
		document.getElementById('ctnrdiv').style.display = 'block'
		if (data.tnr) {
			document.getElementById('tnrdiv').style.display = 'grid'
			document.getElementById('tier').selectedIndex = data.tierIndex
			document.getElementById('region').selectedIndex = data.regionIndex
		}
	}
	if (data.update === 2) {
		document.getElementById('update').style.display = 'block'
		document.getElementById('request').addEventListener('click', () => chrome.runtime.sendMessage({ query: 'request' }, () => {}))
	}
})

chrome.runtime.sendMessage({ query: 'multi' }, (data) => {
	document.getElementById('flashcheckbox').checked = data
})
chrome.runtime.sendMessage({ query: 'flash' }, (data) => {
	document.getElementById('flash').innerHTML = 'Set Flash on ' + (data[0] ? 'F key' : 'D key')
	document.getElementById('flashcheckbox').checked = data[0]
	if (data[1]) document.getElementById('override').style.display = 'block'
	else document.getElementById('override').style.display = 'none'
})
chrome.runtime.sendMessage({ query: 'smite' }, (data) => {
	document.getElementById('smite').innerHTML = 'Set Smite on ' + (data[0] ? 'F key' : 'D key')
	document.getElementById('smitecheckbox').checked = data[0]
	if (data[1]) document.getElementById('override').style.display = 'block'
	else document.getElementById('override').style.display = 'none'
})
chrome.runtime.sendMessage({ query: 'ctnr' }, (data) => {
	document.getElementById('ctnr').innerHTML = data[0] ? 'Custom Tier&Region' : 'Use PLAT+&GLOBAL'
	document.getElementById('ctnrcheckbox').checked = data[0]
	document.getElementById('tier').selectedIndex = data[1]
	document.getElementById('region').selectedIndex = data[2]
})
chrome.runtime.sendMessage({ query: 'disabled' }, (data) => {
	document.getElementById('disabled').innerHTML = 'Extension ' + (data ? 'Disabled' : 'Enabled')
	document.getElementById('disabledcheckbox').checked = !data
})