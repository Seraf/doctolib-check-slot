const TelegramBot = require('node-telegram-bot-api')
const bot = new TelegramBot(process.env['TELEGRAM_TOKEN'], {polling: false})
const axios = require('axios')
const fs = require('fs')

let msgTelegram = {
  message: "Creneaux disponibles\n",
  chatId: process.env['TELEGRAM_CHATID']
}

let lockfile = JSON.parse(fs.readFileSync('lockfile.json'))

let url = `https://www.doctolib.fr/search_results/${process.env['DOCTOLIB_CENTER_ID']}.json?limit=6&ref_visit_motive_ids%5B%5D=6970&ref_visit_motive_ids%5B%5D=7005&speciality_id=5494&search_result_format=json&force_max_limit=2`
axios.get(url)
.then(res => {
  const json = res.data
  let slotstring = ''
  if (json.total === 0) {
    console.log('Pas de creneau dispo')
  } else {
    for (const day in json.availabilities) {
      const slots = json.availabilities[day].slots
      if (slots.length > 0) slotstring += `\n${json.availabilities[day].date}:\n`
      for (const item in slots) {
        const start = new Date(slots[item].start_date)
        if (Number(`${start.getHours()}${start.getMinutes()}`) >= Number(process.env['DOCTOLIB_START_HOUR'])) {
          if (!lockfile.lock.includes(start.toString())) slotstring += `${start.getHours()}h${start.getMinutes()}, `
        }
        lockfile.lock.push(start.toString())
      }
    }
    if (slotstring.indexOf(',') !== -1) bot.sendMessage(msgTelegram.chatId, msgTelegram.message + slotstring.replace(/,\s*$/, ''))
  }
  fs.writeFileSync('lockfile.json', JSON.stringify(lockfile))
})
