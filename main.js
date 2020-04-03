const got = require('got')
const cheerio = require('cheerio')
const fs = require('fs')

function extractCellNumber (cellData) {
    return Number(cellData.trim().replace(/[,+]/mig, ''))
}

async function scrape () {
    const response = await got('https://www.worldometers.info/coronavirus/')
    const $ = cheerio.load(response.body)

    let rootAttributes = {}
    let countries = []
    let rows = $('#main_table_countries_yesterday tbody tr').get()

    for (let row of rows) {
        let cells = $(row).find('td').get()

        if ($(cells[0]).text().toLowerCase().includes('total')) {
            let [totalCases, newCases, totalDeaths, newDeaths, totalRecovered, activeCases, critical] = cells.map(cell => $(cell).text().trim()).slice(1)
            rootAttributes = {
                totalCases:     extractCellNumber(totalCases),
                newCases:       extractCellNumber(newCases),
                totalDeaths:    extractCellNumber(totalDeaths),
                newDeaths:      extractCellNumber(newDeaths),
                totalRecovered: extractCellNumber(totalRecovered),
                activeCases:    extractCellNumber(activeCases),
                critical:       extractCellNumber(critical)
            }
            continue
        }

        countries.push({
            name:           $(cells[0]).text().trim(),
            totalCases:     extractCellNumber($(cells[1]).text()),
            newCases:       extractCellNumber($(cells[2]).text()),
            totalDeaths:    extractCellNumber($(cells[3]).text()),
            newDeaths:      extractCellNumber($(cells[4]).text()),
            totalRecovered: extractCellNumber($(cells[5]).text()),
            activeCases:    extractCellNumber($(cells[6]).text()),
            critical:       extractCellNumber($(cells[7]).text())
        })
    }

    if (countries.length === 0) {
        throw new Error('Countries are empty')
    }

    let DATE_REGEX = /(?<year>[0-9]{4})-(?<month>[0-9]{2})-(?<day>[0-9]{2})/

    let date = new Date()
    date.setDate(date.getDate() - 1)
    let match = DATE_REGEX.exec(date.toISOString())
    let { year, month, day } = match.groups

    let data = {
        date: `${year}-${month}-${day}T23:59:59.000Z`,
        ...rootAttributes,
        countries
    }

    let fileName = './sample.json'

    fs.closeSync(fs.openSync(fileName, 'w'))
    fs.writeFileSync(fileName, JSON.stringify(data, null, 2))
}

scrape()
