'use strict'

chrome.runtime.onMessage.addListener((request, sender, callback) => {
	const getArrayElement = (array, index) => { return array[array.length + index]	}
	const n4 = () => { return Math.floor((1 + Math.random()) * 0x7fff).toString(16) }
	const swapSpell = (spell, setSmiteOnF, setFlashOnF) => {
		if (spell.spell1Id === 11 || spell.spell2Id === 11) {
			let other = spell.spell1Id + spell.spell2Id - 11
			if (setSmiteOnF) {
				spell.spell1Id = other
				spell.spell2Id = 11
			} else {
				spell.spell1Id = 11
				spell.spell2Id = other
			}
		} else if (spell.spell1Id === 4 || spell.spell2Id === 4) {
			let other = spell.spell1Id + spell.spell2Id - 4
			if (setFlashOnF) {
				spell.spell1Id = other
				spell.spell2Id = 4
			} else {
				spell.spell1Id = 4
				spell.spell2Id = other
			}
		}
	}

	if (request.query === 'parse') {
		let title = ''
		let result = { cid: '0', integrity: true, spell: { spell1Id: 0, spell2Id: 0 } }

		result.rune = {
			'autoModifiedSelections': [0],
			'current': true,
			'id': 0,
			'isActive': true,
			'isDeletable': true,
			'isEditable': true,
			'isValid': true,
			'lastModified': 0,
			'name': '',
			'order': 0,
			'primaryStyleId': 0,
			'selectedPerkIds': [],
			'subStyleId': 0
		}
		result.item = {
			'associatedChampions': [],
			'associatedMaps': [],
			'blocks': [],
			'map': 'any',
			'mode': 'any',
			'preferredItemSlots': [],
			'sortrank': 0,
			'startedFrom': 'blank',
			'title': '',
			'type': 'custom',
			'uid': n4() + n4() + '-' + n4() + '-' + n4() + '-' + n4() + '-' + n4() + n4() + n4()
		}
		
		if (window.location.href.includes('lol.ps')) {
			let buildPreference = 'common'
			if (request.option.reference[request.queueType] !== 'LOL.PS') result.integrity = false
			if (request.force) {
				if (document.evaluate('/html/body/main/div[2]/section/div[3]/a[2]', document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue.ariaSelected === "true") buildPreference = 'highest'
			} else {
				if (request.option.useHWRB) {
					buildPreference = 'highest'
					document.evaluate('/html/body/main/div[2]/section/div[3]/a[2]', document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue.click()
				} else document.evaluate('/html/body/main/div[2]/section/div[3]/a[1]', document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue.click()
			}

			const spellMap = { 'SummonerBoost': 1, 'SummonerExhaust': 3, 'SummonerFlash': 4, 'SummonerHaste': 6, 'SummonerHeal': 7, 'SummonerSmite': 11, 'SummonerTeleport': 12, 'SummonerDot': 14, 'SummonerBarrier': 21 }		
			const runeParsingOffset = [ [1, 2], [1, 3], [1, 4], [1, 5], [2, 2], [2, 3], [3, 1], [3, 2], [3, 3] ]
			const itemType = [ 'Starting Item', 'Core Item', '1st Item', '2nd Item', '3rd Item', '4th Item', '5th Item', 'Boots' ]
			title = 'LOL.PS'

			result.cid = getArrayElement(document.evaluate('/html/body/main/div[2]/section/div[1]/div/div', document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue.style.backgroundImage.split('/'), -2)
			if (request.cid !== result.cid * 1) result.integrity = false
			result.spell.spell1Id = spellMap[getArrayElement(document.evaluate('//*[@id="' + buildPreference + '"]/div[2]/div[2]/div[1]/img[1]', document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue.src.split('/'), -1).split('.')[0]]
			result.spell.spell2Id = spellMap[getArrayElement(document.evaluate('//*[@id="' + buildPreference + '"]/div[2]/div[2]/div[1]/img[2]', document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue.src.split('/'), -1).split('.')[0]]
			result.rune.primaryStyleId = getArrayElement(document.evaluate('//*[@id="' + buildPreference + '"]/div[2]/div[1]/div[1]/span[1]/div', document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue.className.split('_'), -1) * 1
			result.rune.subStyleId = getArrayElement(document.evaluate('//*[@id="' + buildPreference + '"]/div[2]/div[1]/div[2]/span[1]/div', document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue.className.split('_'), -1) * 1
			runeParsingOffset.forEach((offset) => {	result.rune.selectedPerkIds.push(getArrayElement(document.evaluate('//*[@id="' + buildPreference + '"]/div[2]/div[1]/div[' + offset[0] + ']/span[' + offset[1] + ']/div', document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue.className.split('_'), -1) * 1) })

			for (let i = 1;i <= itemType.length;i++) {
				let block = { items: [], hideIfSummonerSpell: '', showIfSummonerSpell: '', type: itemType[i - 1] }
				Array.prototype.forEach.call(document.evaluate('//*[@id="' + buildPreference + '"]/div[2]/div[3]/div[' + i + ']', document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue.querySelectorAll('div.item-img'), (item) => { block.items.push({ count: 1, id: getArrayElement(item.className.split('_'), -1) }) })
				result.item.blocks.push(block)
			}
		} else if (window.location.href.includes('lolalytics.com')) {
			if (request.option.reference[request.queueType] !== 'LoLalytics') result.integrity = false
			if (!request.force) {
				if (request.option.useHWRB) document.evaluate('//*[@id="root"]/div/div[3]/div[2]/div[8]/div[1]', document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue.click()
				else document.evaluate('//*[@id="root"]/div/div[3]/div[2]/div[8]/div[2]', document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue.click()
			}
			if (!request.force && !request.option.useHWRB) document.evaluate('//*[@id="root"]/div/div[3]/div[2]/div[8]/div[2]', document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue.click()
			if (document.evaluate('string(//*[@id="root"]/div/div[3]/div[2]/div[8]/h2)', document, null, XPathResult.STRING_TYPE, null).stringValue === '') {
				const runePerkMap = { '-183px -2px': 8005, '-213px -2px': 8008, '-3px -32px': 8021, '-273px -2px': 8010, '-216px -120px': 9101, '-24px -144px': 9111, '-192px 0px': 8009, '-264px -120px': 9104, '0px -144px': 9105, '-240px -120px': 9103, '-240px 0px': 8014, '-264px 0px': 8017, '-96px -72px': 8299,
									'-93px -32px': 8112, '-153px -32px': 8124, '-213px -32px': 8128, '-63px -182px': 9923, '-144px -24px': 8126, '0px -48px': 8139, '-24px -48px': 8143, '-240px -24px': 8136, '-96px -24px': 8120, '-264px -24px': 8138, '-216px -24px': 8135, '-192px -24px': 8134, '-24px -24px': 8105, '-48px -24px': 8106,
									'-93px -62px': 8214, '-183px -62px': 8229, '-213px -62px': 8230, '-96px -48px': 8224, '-120px -48px': 8226, '-72px -72px': 8275, '-48px -48px': 8210, '-240px -48px': 8234, '-216px -48px': 8233, '0px -72px': 8237, '-192px -48px': 8232, '-264px -48px': 8236,
									'-333px -122px': 8437, '-3px -152px': 8439, '-183px -152px': 8465, '-48px -120px': 8446, '-120px -120px': 8463, '-144px -96px': 8401, '-192px -96px': 8429, '-24px -120px': 8444, '-192px -120px': 8473, '-72px -120px': 8451, '-96px -120px': 8453, '-24px -72px': 8242,
									'-33px -122px': 8351, '-153px -122px': 8360, '-93px -122px': 8358, '-144px -72px': 8306, '-120px -72px': 8304, '-168px -72px': 8313, '-216px -72px': 8321, '-192px -72px': 8316, '-264px -72px': 8345, '0px -96px': 8347, '-168px -96px': 8410, '-48px -96px': 8352,
									'-120px 0px': 5008, '-72px 0px': 5005, '-96px 0px': 5007, '-24px 0px': 5002, '-48px 0px': 5003, '0px 0px': 5001 }
				const runeStyleMap = { 9100: 8000, 9900: 8100 }
				const itemType = [ 'Starting Item', 'Core Item', '4th Item', '5th Item', '6th Item' ]
				title = 'LoLalytics'

				result.cid = request.cid
				let championId = window.location.href.split('/')[4]
				if (request.championId !== championId) result.integrity = false
				result.spell.spell1Id = getArrayElement(document.evaluate('//*[@id="root"]/div/div[3]/div[2]/div[9]/div[2]/div[1]/div[3]/div[1]/img', document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue.src.split('/'), -1).split('.')[0] * 1
				result.spell.spell2Id = getArrayElement(document.evaluate('//*[@id="root"]/div/div[3]/div[2]/div[9]/div[2]/div[1]/div[3]/div[3]/img', document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue.src.split('/'), -1).split('.')[0] * 1
				Array.prototype.forEach.call(document.evaluate('//*[@id="root"]/div/div[3]/div[2]/div[9]/div[2]/div[3]', document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue.querySelectorAll('div:not([class])'), (rune) => { if (rune.style.backgroundPosition) { result.rune.selectedPerkIds.push(runePerkMap[rune.style.backgroundPosition]) } })
				Array.prototype.forEach.call(document.evaluate('//*[@id="root"]/div/div[3]/div[2]/div[9]/div[2]/div[4]', document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue.querySelectorAll('div:not([class])'), (rune) => { if (rune.style.backgroundPosition) { result.rune.selectedPerkIds.push(runePerkMap[rune.style.backgroundPosition]) } })
				Array.prototype.forEach.call(document.evaluate('//*[@id="root"]/div/div[3]/div[2]/div[9]/div[2]/div[5]', document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue.querySelectorAll('div:not([class])'), (rune) => { if (rune.style.backgroundPosition) { result.rune.selectedPerkIds.push(runePerkMap[rune.style.backgroundPosition]) } })
				result.rune.primaryStyleId = Math.floor(result.rune.selectedPerkIds[0] / 100) * 100
				result.rune.subStyleId = Math.floor(result.rune.selectedPerkIds[4] / 100) * 100
				if (result.rune.primaryStyleId == 9100 || result.rune.primaryStyleId == 9900) result.rune.primaryStyleId = runeStyleMap[result.rune.primaryStyleId]
				if (result.rune.subStyleId == 9100 || result.rune.subStyleId == 9900) result.rune.subStyleId = runeStyleMap[result.rune.subStyleId]

				for (let i = 1;i <= document.evaluate('count(//*[@id="root"]/div/div[3]/div[2]/div[' + request.option.lolalyticsItemParsingOffset + ']/div[4]/div)', document, null, XPathResult.ANY_TYPE, null).numberValue;i++) {
					let block = { items: [], hideIfSummonerSpell: '', showIfSummonerSpell: '', type: itemType[i - 1] }
					for (let j = 0;j < document.evaluate('count(//*[@id="root"]/div/div[3]/div[2]/div[' + request.option.lolalyticsItemParsingOffset + ']/div[4]/div[' + i + ']/div/img)', document, null, XPathResult.ANY_TYPE, null).numberValue;j++) { block.items.push({ count: 1, id: getArrayElement(document.evaluate('//*[@id="root"]/div/div[3]/div[2]/div[' + request.option.lolalyticsItemParsingOffset + ']/div[4]/div[' + i + ']/div[' + (2 * j + 1) + ']/img', document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue.src.split('/'), -1).split('.')[0] }) }
					result.item.blocks.push(block)
				}
			}
		} else {
			result.unsupported = true
		}
		result.rune.name =  request.queueType === 'RANK' ? title + ' - ' + request.championName : title + ' - ' + request.championName + ' ' + request.queueType
		result.item.title = title + ' Itemset'

		result.item.associatedChampions = [result.cid]
		result.cid *= 1

		swapSpell(result.spell, request.option.setSmiteOnF, request.option.setFlashOnF)
		callback(result)
		return true
	}
})