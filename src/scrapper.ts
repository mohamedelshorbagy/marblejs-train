import { from, forkJoin, zip, merge, defer } from 'rxjs';
import { launch } from 'puppeteer';
import { writeFile } from 'fs';
import { RxHR } from '@akanass/rx-http-request';
import { map } from 'rxjs/operators';
import * as queryString from 'querystring';
import moment from 'moment';
import { readJSON, ensureDir } from 'fs-extra'

async function loadGo(lang = 'ar') {
    let url = `https://new.go-bus.com/search?arrivalDate=11%2F10%2F2019&arrivalStation=1&departureDate=10%2F10%2F2019&departureStation=8&lang=${lang}&passengersNo=1&transportationType=bus&tripType=round`;


    let browser = await launch({ headless: false });
    let page = await browser.newPage();

    await page.goto(url, { waitUntil: ['load', 'domcontentloaded', 'networkidle0', 'networkidle2'] });

    let data = await page.evaluate(() => {
        let data = [];
        let lists = document.querySelectorAll('.list-component-con');
        lists.forEach((list) => {
            let toggleBtn: HTMLElement = list.querySelector('.toggleList.more');
            if (toggleBtn) {
                toggleBtn.click();
            }

            let trip = (list.querySelector('.trip-date') as any).textContent;
            let innerLists = list.querySelectorAll('.list .list-con')
            let obj = { trip, lists: [] };
            innerLists.forEach((innerList) => {
                let leftSide: HTMLElement = innerList.querySelector('.left-side');
                let rightSide: HTMLElement = innerList.querySelector('.right-side');

                let price = (leftSide!.querySelector('h4')).textContent.match(/[0-9]+(\.|:)?[0-9]+/ig)[0];
                let bustype = (rightSide!.querySelector('strong')).textContent;
                let travelMeeting = rightSide!.querySelector('h4').innerText.split('\n').filter(Boolean)[1];
                let travelArrival = rightSide!.querySelector('h5').innerText.split('\n').filter(Boolean)[1];
                let innerListData = {
                    price,
                    bustype,
                    travelMeeting,
                    travelArrival
                };

                obj.lists.push(innerListData);
            })
            data.push(obj);
        });

        return {
            data
        }

    })

    browser.close();

    return data;

}


function loadGOBusStations() {
    return RxHR.get('https://go-bus.com/api/V3/Stations', { json: true })
        .pipe(
            map(res => ({ stations: res.body }))
        )
}


async function loadStations() {
    let url = 'https://tazcara.com/public/';

    let browser = await launch();
    let page = await browser.newPage();

    await page.goto(url, { waitUntil: ['load', 'domcontentloaded', 'networkidle0', 'networkidle2'] });

    let data = await page.evaluate(() => {
        let data = {};
        let lists = document.querySelectorAll('#travel-from2 option');
        lists.forEach((list) => {
            data[list.textContent] = list.getAttribute('value');
        });

        return {
            data
        }

    })

    browser.close();

    return data;


}



async function loadTazacra() {
    let url = 'https://tazcara.com/public/search?travel-from=1&travel-to=4&round=1&travel-date=2019-10-15&travelback-date=';


    let browser = await launch();
    let page = await browser.newPage();

    await page.goto(url, { waitUntil: ['load', 'domcontentloaded', 'networkidle0', 'networkidle2'] });

    let data = await page.evaluate(() => {
        let data = [];
        let lists = document.querySelectorAll('.geodir-category-content-title-item > .row');
        lists.forEach((list) => {
            // Load More Button
            // let toggleBtn: HTMLElement = list.querySelector('.toggleList.more');
            // if(toggleBtn) {
            //     toggleBtn.click();
            // }
            let firstSection = list.querySelector('.col-md-12');
            let secondSection = list.querySelector('.col-md-6');
            let thirdSection = list.querySelector('.col-md-6:last-child');

            // First Section
            // Price
            let price = +firstSection.querySelector('.col-md-4 .priceDiv').textContent.trim().match(/[0-9]+(\.|:)?([0-9]+)?/ig)[0];
            // Meeting Time
            let travelMeeting = firstSection.querySelector('.col-md-8 .title-sin_map').textContent.trim();


            // Second Section
            let [code, chairsLeft] = (secondSection as HTMLElement).innerText.trim().split('\n')
            code = code.match(/[0-9]+(\.|:)?([0-9]+)?/ig)[0];
            chairsLeft = chairsLeft.match(/[0-9]+(\.|:)?([0-9]+)?/ig)[0];

            // Third Section
            let [travelArrival, comapnyName] = (thirdSection as HTMLElement).innerText.trim().split('\n')

            let obj = {
                price,
                travelArrival,
                comapnyName,
                travelMeeting,
                code,
                chairsLeft
            }

            data.push(obj);
        });

        return {
            tazacra: data
        }

    })

    browser.close();

    return data;

}

async function loadOtbeesy() {
    let url = 'https://otobeesy.com';

    let browser = await launch();
    let page = await browser.newPage();

    await page.goto(url, { waitUntil: ['load', 'domcontentloaded', 'networkidle0', 'networkidle2'] });



    // Change To
    await page.waitForSelector('#List_OfficeFrom_Code')
    await page.click('#List_OfficeFrom_Code > li[id="2011"] > a')
    await page.waitForSelector('#List_OfficeTo_Code')
    await page.$eval(
        '#List_OfficeTo_Code > li[id="2051"] > a',
        (e) => (e as any).click()
    )
    await page.waitForSelector('#tripDate')
    await page.$eval(
        'input#tripDate',
        (e) => e.setAttribute("value", '15/10/2019')
    )

    await page.waitForSelector('#BtnFindTrips1');
    await page.$eval(
        '#BtnFindTrips1',
        (e) => (e as any).click()
    )

    await page.waitForNavigation({ waitUntil: ['load', 'domcontentloaded', 'networkidle0', 'networkidle2'] });
    await page.waitForSelector('#buses', { visible: true });
    await page.waitForSelector('.view-seat', { visible: true });
    let listsData = [];
    let links = await page.$$('.item.Go');
    for (let [index, item] of Object.entries(links)) {
        let link = await item.$('.show-default .right a span.view-seat')
        let id = await (await item.getProperty('id')).jsonValue();
        await link.click();
        await page.waitForSelector(`.item.Go#${id} .show-click .show-seats .seats-con .seats .clsBusFram`)
        let seatNumber = await item.$('.show-click .show-seats .available')
        let text = await (await seatNumber.getProperty('textContent')).jsonValue();
        let object = await page.evaluate((index, seatNumber) => {
            let list = document.querySelectorAll('.item.Go')[index];
            let showDefaults = list.querySelector('.show-default');
            let timeDeparture = showDefaults.querySelector('.date').textContent.trim().split(' ').filter(Boolean).join(' ')
            let price = showDefaults.querySelector('.right .price').textContent.trim().split(' ').filter(Boolean).join(' ')
            let busServiceKind = showDefaults.querySelector('.class-badge').textContent.trim();


            // let availableSeats = list.querySelector('.show-click .show-seats .available');
            let remainChairs = seatNumber.match(/[0-9]+(:|.)?([0-9]+)?/)[0].trim();

            let obj: { [prop: string]: any } = {
                price,
                busServiceKind,
                departureDate: timeDeparture,
                remainChairs
            }
            return obj;
        }, index, text)

        listsData.push(object);

    }
    browser.close();

    return listsData;

}






function loadGoTrips({ From, To, tripDate, tripType = '' }) {
    let queryParams = queryString.stringify({ From, To, tripType, tripDate })
    return RxHR
        .get(`https://go-bus.com/api/V3/GetTrips?${queryParams}`, { json: true })
        .pipe(
            map(res => res.body)
        );


}


const saveFile = (path, data) => {
    writeFile(path, data, (err) => { if (err) throw err; })
}
let lang = 'en';

// let loadGo$ = from(loadGo(lang));
export let loadTazacra$ = from(loadTazacra());
// let loadTazacraStations$ = from(loadStations());
// let loadGoStations$ = loadGOBusStations();
// loadTazacra$.subscribe(res => {
//     saveFile('tazacra.json', JSON.stringify(res, null, 2));
// });


// loadGo$.subscribe(res => {
//     saveFile(`go-${lang}.json`, JSON.stringify(res, null, 2));
// });


// loadTazacraStations$.subscribe(res => {
//     saveFile(`tazacra-stations.json`, JSON.stringify(res, null, 2));
// })


// loadGoStations$
//     .subscribe(res => {
//         saveFile(`go-stations.json`, JSON.stringify(res, null, 2));
//     })



let params = {
    arrivalDate: '13/10/2019',
    arrivalStation: '1',
    departureDate: '',
    departureStation: '10/10/2019',
    passengersNo: '1',
    transportationType: 'bus',
    tripType: 'round',
    lang: 'ar'
}

// console.log(queryString.stringify(params));



export let loadGoDataFn$ = ({ From, To, tripDate, tripType = '' }) => loadGoTrips({ From, To, tripDate, tripType })
    .pipe(
        map(data => {
            let dataNormalized = data.map(
                item => {
                    let price = item.TripPrice;
                    let remainChairs = item.RemainChairs;
                    let totalChairs = item.TotalChairs;
                    let busType = item.TripServKind_NameA;
                    let date = moment(item.TripDateTime);
                    let departureDate = date.format('hh:mm a');
                    let arrivalDate = date.add(item.TimeHours, 'h').add(item.TimeMinutes, 'm').format('hh:mm a');
                    let officeFrom = item.TripOfficeFrom_NameE;
                    let officeTo = item.TripOfficeTo_NameE;
                    let busServiceKind = item.TripServKind_NameE;
                    return {
                        price,
                        remainChairs,
                        totalChairs,
                        busType,
                        departureDate,
                        arrivalDate,
                        officeFrom,
                        officeTo,
                        busServiceKind
                    }
                }
            )
            return dataNormalized;
        }),
        map(data => ({ go: data }))
    )


export let loadGoData$ = loadGoDataFn$({ From: 9, To: 1, tripDate: '16/10/2019' });


// loadData$
//         .subscribe(res => {
//             console.log(res);
//         })


export let loadOtbeesy$ = defer(() => loadOtbeesy()).pipe(
    map(res => ({ otbeesy: res }))
)



function getDaysOfCurrentWeek() {
    var startOfWeek = moment().startOf('isoWeek');
    var endOfWeek = moment().endOf('isoWeek');

    var days = [];
    var day = startOfWeek;

    while (day <= endOfWeek) {
        days.push([day.format('DD/MM/YYYY'), day.format('dddd')]);
        day = day.clone().add(1, 'd');
    }

    return days;
}




async function loadTrain(switchLang = false) {
    let url = 'https://enr.gov.eg/ticketing/public/login.jsf';
    let browser = await launch({ headless: false });
    let page = await browser.newPage();
    let menu: string[] = await readJSON('./train_options.json');
    let headers = await readJSON('./headers.json');

    await page.goto(url, { waitUntil: ['load', 'domcontentloaded', 'networkidle0', 'networkidle2'] });

    if (switchLang) {
        await page.waitForSelector('#menu a.lang')
        await page.click('#menu a.lang')
        // await page.waitForNavigation({ waitUntil: ['load', 'domcontentloaded'] });
        await page.waitFor(3000);
    }

    // Change To
    await page.waitForSelector('#menu li:nth-of-type(2) a')
    await page.click('#menu li:nth-of-type(2) a')

    await page.waitForSelector('.boxForm')
    await ensureDir(`trains`);

    let days = getDaysOfCurrentWeek();
    for (let [actualDate, dayName] of days) {
        let dirName = `${dayName}_${actualDate.split('/').join('-')}`;
        await ensureDir(`trains/${dirName}`);


        for (let i = 0; i < menu.length; i++) {
            let allValues = [];
            let stationName = '';
            for (let j = 0; j < menu.length; j++) {
                if (i === j) {
                    continue;
                } else {
                    let start = menu[i];
                    let end = menu[j];
                    await page.waitForSelector('select[name="smartSearch:startStationInput"]');
                    await page.select('select[name="smartSearch:startStationInput"]', start);
                    await page.waitForSelector('select[name="smartSearch:endStationInput"]');
                    await page.select('select[name="smartSearch:endStationInput"]', end);

                    await page.waitForSelector('input[name="smartSearch:departureDateInput"]');
                    await page.$eval(
                        'input[name="smartSearch:departureDateInput"]',
                        (e, actualDate) => e.setAttribute("value", actualDate),
                        actualDate
                    )
                    await page.waitForSelector('select[name="smartSearch:passengerTypeInput"]');
                    await page.select('select[name="smartSearch:passengerTypeInput"]', "1");
                    await page.waitForSelector('input[name="smartSearch:searchButton"]');
                    await page.click('input[name="smartSearch:searchButton"]');


                    await page.waitFor(3000);

                    let selectedStation = await page.$('select[name="smartSearch:startStationInput"] option[selected]');

                    let stationNameElm: string = await (await selectedStation.getProperty('textContent')).jsonValue();
                    stationName = stationNameElm;

                    let numOfTrainsValueNum: number = 0;
                    let numberOfTrainsContainer = await page.$('table[id="smartSearch:matchedRecordsGrid"] tr td span');
                    if (numberOfTrainsContainer) {
                        let numOfTrainsValue: string = await (await numberOfTrainsContainer.getProperty('textContent')).jsonValue();
                        numOfTrainsValueNum = +numOfTrainsValue.match(/[0-9]+/ig)[0];
                    }


                    // await page.waitForSelector('thead.dr-table-thead > tr > th');
                    let theads = await page.$$("thead.dr-table-thead > tr > th");
                    if (theads && theads.length) {


                        if(numOfTrainsValueNum) {
                            await page.waitForSelector('td.dr-dscr-button.rich-datascr-button:nth-of-type(1)');
                            await page.click('td.dr-dscr-button.rich-datascr-button:nth-of-type(1)');
                            await page.waitFor(1000);
                        }


                        // await page.waitForSelector('tbody[id="smartSearch:schedulesList:tb"] > tr.dr-table-firstrow.rich-table-firstrow');
                        let trs = await page.$$('tbody[id="smartSearch:schedulesList:tb"] > tr.dr-table-firstrow.rich-table-firstrow');
                        let dataTrs = [];
                        let paginateTrs = [];
                        if (trs && trs.length) {
                            var data = await getData(trs, headers);
                            dataTrs.push(...data);
                        }

                        
                        if (numOfTrainsValueNum) {
                            numOfTrainsValueNum = Math.ceil(numOfTrainsValueNum / 5)
                            for (let d = 1; d < numOfTrainsValueNum; d++) {
                                // CLICKS
                                await page.waitForSelector('td.dr-dscr-button.rich-datascr-button');
                                let btnNum = (6 + numOfTrainsValueNum) - 1;
                                await page.click(`td.dr-dscr-button.rich-datascr-button:nth-of-type(${btnNum})`)
                                await page.waitFor(2000);
                                let trs = await page.$$('tbody[id="smartSearch:schedulesList:tb"] > tr.dr-table-firstrow.rich-table-firstrow');
                                var data = await getData(trs, headers);
                                paginateTrs.push(...data);


                            }
                        }

                        allValues.push({ From: start, To: end, trains: [...dataTrs, ...paginateTrs] })
                        let trainData = { From: start, To: end, trains: [...dataTrs, ...paginateTrs] };
                        // saveFile(`trains/${dirName}/${menu[i]}_${stationName}_${end}_lang_trains.json`, JSON.stringify(trainData, null, 2));
                    }
                }

            }
            saveFile(`trains/${dirName}/${stationName}_${menu[i]}_trains.json`, JSON.stringify(allValues, null, 2));

        }

    }

    browser.close();

    return [];

}


async function getMenu() {
    let url = 'https://enr.gov.eg/ticketing/public/login.jsf';
    //'li:nth-of-type(2) a'
    let browser = await launch({ headless: false });
    let page = await browser.newPage();

    await page.goto(url, { waitUntil: ['load', 'domcontentloaded', 'networkidle0', 'networkidle2'] });



    // Change To
    await page.waitForSelector('#menu li:nth-of-type(2) a')
    await page.click('#menu li:nth-of-type(2) a')
    // await page.waitForNavigation({ waitUntil: ['load', 'domcontentloaded'] });

    await page.waitForSelector('.boxForm')

    let menu = await page.$$('select[name="smartSearch:startStationInput"] > option');
    let options = [];
    for (let option of menu) {
        let value = await (await option.getProperty('value')).jsonValue();
        if (value) {
            options.push(value);
        }
    }

    return options;
}



async function getHeadersEnglish() {
    let url = 'https://enr.gov.eg/ticketing/public/login.jsf';
    //'li:nth-of-type(2) a'
    let browser = await launch({ headless: false });
    let page = await browser.newPage();

    await page.goto(url, { waitUntil: ['load', 'domcontentloaded', 'networkidle0', 'networkidle2'] });



    // Change To
    await page.waitForSelector('#menu a.lang')
    await page.click('#menu a.lang')
    // await page.waitForNavigation({ waitUntil: ['load', 'domcontentloaded'] });
    await page.waitFor(3000);
    await page.waitForSelector('#menu li:nth-of-type(2) a');
    await page.click('#menu li:nth-of-type(2) a');
    await page.waitForSelector('.boxForm');


    await page.waitForSelector('select[name="smartSearch:startStationInput"]');
    await page.select('select[name="smartSearch:startStationInput"]', "1");
    await page.waitForSelector('select[name="smartSearch:endStationInput"]');
    await page.select('select[name="smartSearch:endStationInput"]', "819");
    await page.waitForSelector('input[name="smartSearch:departureDateInput"]');
    await page.type('input[name="smartSearch:departureDateInput"]', "15/10/2019")
    await page.waitForSelector('select[name="smartSearch:passengerTypeInput"]');
    await page.select('select[name="smartSearch:passengerTypeInput"]', "1");
    await page.waitForSelector('input[name="smartSearch:searchButton"]');
    await page.click('input[name="smartSearch:searchButton"]');


    await page.waitFor(3000);


    let headers = [];
    // await page.waitForSelector('thead.dr-table-thead > tr > th');
    let theads = await page.$$("thead.dr-table-thead > tr > th");
    if (theads && theads.length) {
        for (let th of theads) {
            let value = await (await th.getProperty('textContent')).jsonValue();
            headers.push(value);
        }
    }


    return headers;


}


async function getData(trs, headers) {
    let listData = [];
    for (let item of trs) {
        let links = await item.$$(':scope > td'); // 10
        let tdValues = {};
        for (let [index, td] of Object.entries(links)) {
            let value = await (await (<any>td).getProperty('innerText')).jsonValue();
            let splitters = value.split('\n');
            if (splitters && splitters.length > 1) {
                tdValues[headers[index]] = splitters;
            } else {
                tdValues[headers[index]] = splitters.shift();
            }
        }
        let degrees: string[] = tdValues['Coach Class'];
        let prices: string[] = tdValues['Price'];
        let obj = [];
        for (let [index, degree] of Object.entries(degrees)) {
            obj.push([degree, prices[index]]);
        }
        delete tdValues['Coach Class'];
        delete tdValues['Price'];
        tdValues = { ...tdValues, 'Price': obj };
        listData.push(tdValues);
    }

    return listData;

}


// let loadTrain$ = defer(() => loadTrain(true));

// loadTrain$
//     .subscribe(
//         res => {
//             saveFile('train_1.json', JSON.stringify({ data: res }, null, 2))
//         }
//     )

// defer(() => getMenu())
//     .subscribe(
//         res => {
//             saveFile('train_options.json', JSON.stringify(res, null, 2));
//         }
//     )

// defer(() => getHeadersEnglish())
//     .subscribe(res => {
//         saveFile('headers.json', JSON.stringify(res, null, 2))
//     })










