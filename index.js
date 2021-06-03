// 引用套件
import linebot from 'linebot'
// 處理.env 環境變數
import dotenv from 'dotenv'
// 檔案處理套件
import fs from 'fs'
import axios from 'axios'

// 套件讀取.env檔案
// 讀取後可用 process.env.變數 使用
dotenv.config()

const bot = linebot({
  channelId: process.env.CHANNEL_ID,
  channelSecret: process.env.CHANNEL_SECRET,
  channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN
})

bot.listen('/', process.env.PORT, () => {
  console.log('機器人啟動')
})

// 回應事件
const flex = {
  type: 'bubble',
  hero: {
    type: 'image',
    url: 'https://static.thenounproject.com/png/1149910-200.png',
    size: 'md',
    offsetTop: 'none'
  },
  body: {
    type: 'box',
    layout: 'vertical',
    contents: [
      {
        type: 'text',
        text: 'hello, world'
      }
    ]
  }
}
const distance = (lat1, lon1, lat2, lon2, unit) => {
  if (lat1 === lat2 && lon1 === lon2) {
    return 0
  } else {
    const radlat1 = (Math.PI * lat1) / 180
    const radlat2 = (Math.PI * lat2) / 180
    const theta = lon1 - lon2
    const radtheta = (Math.PI * theta) / 180
    let dist = Math.sin(radlat1) * Math.sin(radlat2) + Math.cos(radlat1) * Math.cos(radlat2) * Math.cos(radtheta)
    if (dist > 1) {
      dist = 1
    }
    dist = Math.acos(dist)
    dist = (dist * 180) / Math.PI
    dist = dist * 60 * 1.1515
    if (unit === 'K') {
      dist = dist * 1.609344
    }
    if (unit === 'N') {
      dist = dist * 0.8684
    }
    return dist
  }
}
bot.on('message', async event => {
  if (event.message.type === 'location') {
    try {
      const response = await axios.get('https://quality.data.gov.tw/dq_download_json.php?nid=121909&md5_url=8eb70d0c924b885c38231d61128615fa ')
      const lat1 = event.message.latitude
      const lon1 = event.message.longitude
      const data = response.data
        .map(d => {
          const lat2 = d['緯度']
          const lon2 = d['經度']
          d.dis = distance(lat1, lon1, lat2, lon2, 'K')
          return d
        })
        .sort((a, b) => a.dis - b.dis)
        .slice(0, 5)
        .map(d => {
          d = {
            type: 'location',
            address: d['備註'],
            title: d['行政區'] + d['路名'] + d['位置'],
            latitude: d['緯度'],
            longitude: d['經度']
          }
          return d
        })
      event.reply(data)
    } catch (error) {
      event.reply('發生錯誤')
    }
  }
})
