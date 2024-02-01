{
	"translatorID": "cc0a1841-e337-4629-a581-2fc10005a5be",
	"label": "flk.npc.gov.cn",
	"creator": "jiaojiaodubai",
	"target": "^https?://flk\\.npc\\.gov\\.cn",
	"minVersion": "5.0",
	"maxVersion": "",
	"priority": 100,
	"inRepository": true,
	"translatorType": 4,
	"browserSupport": "gcsibv",
	"lastUpdated": "2024-01-23 13:47:37"
}

/*
	***** BEGIN LICENSE BLOCK *****

	Copyright © 2024 jiaojiaodubai<jiaojiaodubai23@gmail.com>

	This file is part of Zotero.

	Zotero is free software: you can redistribute it and/or modify
	it under the terms of the GNU Affero General Public License as published by
	the Free Software Foundation, either version 3 of the License, or
	(at your option) any later version.

	Zotero is distributed in the hope that it will be useful,
	but WITHOUT ANY WARRANTY; without even the implied warranty of
	MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
	GNU Affero General Public License for more details.

	You should have received a copy of the GNU Affero General Public License
	along with Zotero. If not, see <http://www.gnu.org/licenses/>.

	***** END LICENSE BLOCK *****
*/


function detectWeb(doc, url) {
	if (url.includes('/detail2.html?') || url.includes('/detail.html?') || url.includes('/xf/html/')) {
		return text(doc, '#xlwj') == '司法解释'
			? 'report'
			: 'statute';
	}
	else if (getSearchResults(doc, true)) {
		return 'multiple';
	}
	return false;
}

function getSearchResults(doc, checkOnly) {
	var items = {};
	var found = false;
	// TODO: adjust the CSS selector
	var rows = doc.querySelectorAll('h2 > a.title[href*="/article/"]');
	for (let row of rows) {
		// TODO: check and maybe adjust
		let href = row.href;
		// TODO: check and maybe adjust
		let title = ZU.trimInternal(row.textContent);
		if (!href || !title) continue;
		if (checkOnly) return true;
		found = true;
		items[href] = title;
	}
	return found ? items : false;
}

async function doWeb(doc, url) {
	if (detectWeb(doc, url) == 'multiple') {
		let items = await Zotero.selectItems(getSearchResults(doc, false));
		if (!items) return;
		for (let url of Object.keys(items)) {
			await scrape(await requestDocument(url));
		}
	}
	else {
		await scrape(doc, url);
	}
}

async function scrape(doc, url = doc.location.href) {
	var newItem = new Z.Item(detectWeb(doc, url));
	newItem.title = text(doc, '#flName');
	if (newItem.title.startsWith('中华人民共和国')) {
		newItem.shortTitle = newItem.title.substring(7);
	}
	switch (newItem.itemType) {
		case 'statute': {
			newItem.dateEnacted = text(doc, '#gbrq');
			if (text(doc, '#xlwj') == '行政法规') {
				extra.add('Type', 'regulation', true);
			}
			extra.add('appyDate', text(doc, '#sxrq'));
			break;
		}
		case 'report':
			newItem.date = text(doc, '#gbrq');
			break;
	}
	newItem.rights = '版权所有 © 全国人大常委会办公厅';
	newItem.language = 'zh-CN';
	newItem.url = url;
	if (text(doc, '#sxx') == '已废止') {
		extra.add('Status', '已废止', true);
	}
	text(doc, '#zdjg').split('、').forEach((creator) => {
		creator = ZU.cleanAuthor(creator, 'author');
		creator.fieldMode = 1;
		newItem.creators.push(creator);
	});
	
	//模拟点击
	doc.querySelector('#gbdiv #gb').click();
	
	let pdfLink = attr(doc, '#codeMa', 'src');
	Z.debug(pdfLink);
	if (pdfLink ) {
		if (pdfLink.includes('https://wb.flk.npc.gov.cn')) {
			pdfLink = pdfLink.replace(/([\w.:/]+)\/PNG\/(\w+)\.png/, '$1/PDF/$2.pdf');
		}else {
			pdfLink= 'https://wb.flk.npc.gov.cn/xffl' + pdfLink.replace(/\.\.\/images\/(\w+)\.png/, '/PDF/$1.pdf'); //xffl - 宪法
			Z.debug (pdfLink);
		}
		newItem.attachments.push({
				url: pdfLink,
				title: 'Full Text PDF',
				mimeType: 'application/pdf'
		});				
	}
	
	newItem.extra = extra.toString();
	newItem.complete();
}

const extra = {
	clsFields: [],
	elseFields: [],
	add: function (key, value, cls = false) {
		if (value && cls) {
			this.clsFields.push([key, value]);
		}
		else if (value) {
			this.elseFields.push([key, value]);
		}
	},
	toString: function () {
		return [...this.clsFields, ...this.elseFields]
			.map(entry => `${entry[0]}: ${entry[1]}`)
			.join('\n');
	}
};

/** BEGIN TEST CASES **/
var testCases = [
	{
		"type": "web",
		"url": "https://flk.npc.gov.cn/detail2.html?MmM5MDlmZGQ2NzhiZjE3OTAxNjc4YmY3NmFiYjA3MGQ%3D",
		"items": [
			{
				"itemType": "statute",
				"nameOfAct": "中华人民共和国公司法",
				"creators": [
					{
						"firstName": "",
						"lastName": "全国人民代表大会常务委员会",
						"creatorType": "author",
						"fieldMode": 1
					}
				],
				"dateEnacted": "2013-12-28",
				"extra": "appyDate: 2014-03-01",
				"language": "zh-CN",
				"rights": "版权所有 © 全国人大常委会办公厅",
				"shortTitle": "公司法",
				"url": "https://flk.npc.gov.cn/detail2.html?MmM5MDlmZGQ2NzhiZjE3OTAxNjc4YmY3NmFiYjA3MGQ%3D",
				"attachments": [
					{
						"title": "Full Text PDF",
						"mimeType": "application/pdf"
					}
				],
				"tags": [],
				"notes": [],
				"seeAlso": []
			}
		]
	},
	{
		"type": "web",
		"url": "https://flk.npc.gov.cn/detail2.html?ZmY4MDgwODE2ZjNjYmIzYzAxNmY0MTM0NjY1NDFjZWU%3D",
		"items": [
			{
				"itemType": "statute",
				"nameOfAct": "中华人民共和国公司登记管理条例",
				"creators": [
					{
						"firstName": "",
						"lastName": "国务院",
						"creatorType": "author",
						"fieldMode": 1
					}
				],
				"dateEnacted": "2016-02-06",
				"extra": "Type: regulation\nStatus: 已废止",
				"language": "zh-CN",
				"rights": "版权所有 © 全国人大常委会办公厅",
				"shortTitle": "公司登记管理条例",
				"url": "https://flk.npc.gov.cn/detail2.html?ZmY4MDgwODE2ZjNjYmIzYzAxNmY0MTM0NjY1NDFjZWU%3D",
				"attachments": [
					{
						"title": "Full Text PDF",
						"mimeType": "application/pdf"
					}
				],
				"tags": [],
				"notes": [],
				"seeAlso": []
			}
		]
	},
	{
		"type": "web",
		"url": "https://flk.npc.gov.cn/xf/html/xf7.html",
		"items": [
			{
				"itemType": "statute",
				"nameOfAct": "中华人民共和国宪法修正案（1988年）",
				"creators": [
					{
						"firstName": "",
						"lastName": "全国人民代表大会",
						"creatorType": "author",
						"fieldMode": 1
					}
				],
				"dateEnacted": "1988-04-12",
				"extra": "appyDate: 1988-04-12",
				"language": "zh-CN",
				"rights": "版权所有 © 全国人大常委会办公厅",
				"shortTitle": "宪法修正案（1988年）",				
				"url": "https://flk.npc.gov.cn/xf/html/xf7.html",
				"attachments": [
					{
						"title": "Full Text PDF",
						"mimeType": "application/pdf"
					}
				],
				"tags": [],
				"notes": [],
				"seeAlso": []
			}
		]
	},	
	{
		"type": "web",
		"url": "https://flk.npc.gov.cn/detail2.html?MmM5MGU1YmE2NWM2OGNmNzAxNjdmMjlkMGU2MDRlYzQ%3D",
		"items": [
			{
				"itemType": "report",
				"title": "最高人民法院关于适用《中华人民共和国行政诉讼法》的解释",
				"creators": [
					{
						"firstName": "",
						"lastName": "最高人民法院",
						"creatorType": "author",
						"fieldMode": 1
					}
				],
				"date": "2018-02-06",
				"language": "zh-CN",
				"libraryCatalog": "flk.npc.gov.cn",
				"rights": "版权所有 © 全国人大常委会办公厅",
				"url": "https://flk.npc.gov.cn/detail2.html?MmM5MGU1YmE2NWM2OGNmNzAxNjdmMjlkMGU2MDRlYzQ%3D",
				"attachments": [
					{
						"title": "Full Text PDF",
						"mimeType": "application/pdf"
					}
				],
				"tags": [],
				"notes": [],
				"seeAlso": []
			}
		]
	}
]
/** END TEST CASES **/
