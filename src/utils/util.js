function calculateAverageScore(scores, days = null) {
  if (!days || !Number.isInteger(days) || days < 1) {
    days = scores.length
  }
  const dateCutoff = new Date()
  dateCutoff.setDate(dateCutoff.getDate() - days + 1)

  const filteredScores = scores.filter((score) => {
    const scoreDate = new Date(
      score.time.toString().replace(/(\d{4})(\d{2})(\d{2})/, '$1-$2-$3')
    )
    return scoreDate >= dateCutoff
  })

  const totalScore = filteredScores.reduce((sum, score) => sum + score.score, 0)
  const averageScore = Math.round(totalScore / filteredScores.length)

  return averageScore
}

function formatToTitle(data) {
  return data.RECORDS.map((item) => item.title)
}

function getCurrentAndLastYear() {
  const now = new Date()
  const year = now.getFullYear()
  const month = (now.getMonth() + 1).toString().padStart(2, '0')
  const day = now.getDate().toString().padStart(2, '0')

  const currentDate = `${year}${month}${day}`

  const lastYear = year - 1
  const lastYearDate = `${lastYear}${month}${day}`

  return {
    currentDate,
    lastYearDate,
  }
}

module.exports = {
  calculateAverageScore,
  formatToTitle,
  getCurrentAndLastYear,
}
