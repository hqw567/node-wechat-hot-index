const fs = require('fs')
const axios = require('axios')
const path = require('path')
const XLSX = require('xlsx')

const fileName = 'chuzhong' // 需要爬取数据的文件名称

const {
  calculateAverageScore,
  formatToTitle,
  getCurrentAndLastYear,
} = require('./utils/util')
const file_data = JSON.parse(
  fs.readFileSync(path.resolve(__dirname, `../file/json/${fileName}.json`))
)
const f_data = formatToTitle(file_data)

const url = 'https://search.weixin.qq.com/cgi-bin/wxaweb/wxindex'
const search_key = '1683621604602594_1471472904' // 微信指数 小程序中抓包的search_key 20分钟左右有效 ,search.weixin.qq.com
const query = ['周南中学']
const start_ymd = getCurrentAndLastYear().lastYearDate
const end_ymd = getCurrentAndLastYear().currentDate

const requestData = {
  openid: 'ov4ns0IUCc-dP_lGYobnlKZW-sZw',
  search_key,
  cgi_name: 'GetDefaultIndex',
  query,
  start_ymd,
  end_ymd,
}

const config = {
  header: {
    'Content-Type': 'application/json',
    'User-Agent':
      'Mozilla/5.0 (Linux; Android 13; Mi 13 Build/RKQ1.200826.002; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/107.0.5304.141 Mobile Safari/537.36 XWEB/5049 MMWEBSDK/20230202 MMWEBID/80 MicroMessenger/8.0.33.2320(0x28002137) WeChat/arm64 Weixin NetType/WIFI Language/zh_CN ABI/arm64 MiniProgramEnv/android',
    Referer: 'https://servicewechat.com/wxc026e7662ec26a3a/42/page-frame.html',
  },
}

let finalResult = []
;(async () => {
  for (const item of f_data) {
    requestData.query = [item]
    const {
      thirtyDayAvg,
      ninetyDayAvg,
      overallAvg,
      sevenDayAvg,
      halfYearAvg,
      sixtyDayAvg,
      maxScore,
      minScore,
    } = await calculateScores(url, JSON.stringify(requestData), config)

    finalResult.push({
      title: item,
      thirtyDayAvg,
      ninetyDayAvg,
      overallAvg,
      sevenDayAvg,
      halfYearAvg,
      sixtyDayAvg,
      maxScore,
      minScore,
    })
  }
  finalResult = finalResult.sort((a, b) => b.maxScore - a.maxScore)
  // console.log(finalResult)
  const sheet = XLSX.utils.json_to_sheet(finalResult)
  const book = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(book, sheet, 'Sheet1')
  const buffer = XLSX.write(book, { type: 'buffer' })
  try {
    const dirpath = path.resolve(__dirname, '../file/result/')
    if (!fs.existsSync(dirpath)) {
      fs.mkdirSync(dirpath, { recursive: true })
    }

    // write file
    const filepath = path.resolve(
      __dirname,
      '../file/result/' + `${fileName}_${new Date().getTime()}.json`
    )
    const filepath_xlsx = path.resolve(
      __dirname,
      '../file/result/' + `${fileName}_${new Date().getTime()}.xlsx`
    )
    fs.writeFileSync(filepath, JSON.stringify(finalResult))
    fs.writeFileSync(filepath_xlsx, buffer)
    console.log(`File ${filepath} saved successfully.`)
  } catch (err) {
    console.error(`Error occurred while processing file: ${err}`)
  }
})()

async function calculateScores(url, requestData, config) {
  const res = await axios.post(url, requestData, config)
  const { code, content } = res.data
  if (code === 0) {
    const { indexes, query } = content.resp_list[0]
    const scores = indexes[0].time_indexes
    const maxScore = Math.max(...scores.map((item) => item.score))
    const minScore = Math.min(...scores.map((item) => item.score))
    const thirtyDayAvg = calculateAverageScore(scores, 30)
    const ninetyDayAvg = calculateAverageScore(scores, 90)
    const sevenDayAvg = calculateAverageScore(scores, 7)
    const sixtyDayAvg = calculateAverageScore(scores, 60)
    const halfYearAvg = calculateAverageScore(scores, 180)
    const overallAvg = calculateAverageScore(scores)
    console.log(`${query}   的最近365天最大热度为: ${maxScore}`)
    return {
      thirtyDayAvg,
      ninetyDayAvg,
      overallAvg,
      sevenDayAvg,
      halfYearAvg,
      sixtyDayAvg,
      maxScore,
      minScore,
    }
  }
  return {
    thirtyDayAvg: 0,
    ninetyDayAvg: 0,
    overallAvg: 0,
    sevenDayAvg: 0,
    halfYearAvg: 0,
    sixtyDayAvg: 0,
    maxScore: 0,
    minScore: 0,
  }
}
