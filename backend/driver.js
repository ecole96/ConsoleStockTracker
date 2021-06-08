// This is essentially the backend worker script for Console Stock Tracker - it collects and processes console stock data using retailer APIs, updates the records in the project's database, and sends stock alert emails as necessary

var axios = require('axios');
var mongoose = require('mongoose');
var nodemailer = require('nodemailer');
var User = require('./models/User.model');
var Stock = require('./models/Stock.model');
var LastRun = require('./models/LastRun.model');
var UserAgent = require('user-agents');
require('dotenv').config();

// first step of script: makes a store API request and parses the data into a simple dictionary with only the information we need
function gather(url,consoleName,storeName) {
    return new Promise(async (resolve, reject) => {
        try {
            const headers = generateHeaders(storeName,consoleName);
            // setting proxy to protect from being blocked by retailer APIs
            const proxy = process.env.PROXY_HOST && process.env.PROXY_PORT && process.env.PROXY_USER && process.env.PROXY_PASS ?
                          {host: process.env.PROXY_HOST, port: Number(process.env.PROXY_PORT), auth: {username: process.env.PROXY_USER, password: process.env.PROXY_PASS}}
                          : null;
            const config = {headers: headers, timeout:15000};
            if (proxy) config['proxy'] = proxy;
            let response;
            if (storeName == 'Microsoft') { // Microsoft request requires POST
                const payload = [{"skuId":"RRS-00001","distributorId":"9000000013"},{"skuId":"RRT-00001","distributorId":"9000000013"}];
                response = await axios.post(url, payload, config);
            }
            else
                response = await axios.get(url, config);
            let data = parseData(response.data,storeName,consoleName) // extract all necessary data from response
            resolve(data); // return store stock data
        }
        catch (err) { // error occurred - return with an empty array we can skip over when processing
            console.log(consoleName,"@",storeName,"error:",err.message);
            reject([]);
        }
    });
}

// generates headers for API requests
function generateHeaders(storeName,consoleName) {
    let headers = {'User-Agent': new UserAgent().toString(), 'accept':'application/json'}; // base header (randomizes user agent)
    if(storeName == 'Sony') { // Sony headers
        headers['referer'] = 'https://direct.playstation.com/';
        headers['Content-Type'] = 'application/json';
    }
    else if(storeName == 'Walmart') {
        headers['accept-language'] = 'en-US,en;q=0.9';
        headers['cache-control'] = 'max-age=0';
        headers['cookie'] = 'vtc=; _pxvid=; auth=; type=; ACID=; hasACID=; _abck=; cart-item-count=; DL=; t-loc-zip=; TBV=; TB_Latency_Tracker_100=; TB_Navigation_Preload_01=; TB_SFOU-100=; athrvi=; tb_sw_supported=; com.wm.reflector=; next-day=; location-data=; TB_DC_Flap_Test=; g=; bstc=; mobileweb=0; xpa=; xpm=; TS01b0be75=; TS013ed49a=; akavpau_p8=;';
        headers['sec-fetch-dest'] = 'document';
        headers['sec-fetch-mode'] = 'navigate';
        headers['sec-fetch-site'] = 'none';
        headers['sec-fetch-user'] = '?1';
        headers['sec-gpc'] = '1';
        headers['upgrade-insecure-requests'] = '1';
    }
    else if(['Gamestop','Newegg','Microsoft'].includes(storeName)) { // Gamestop, Newegg, Microsoft headers
        headers['accept-encoding'] =  'gzip, deflate, br';
        headers['accept-language'] = 'en-US,en;q=0.9';
        headers['sec-fetch-dest'] = 'empty'
        headers['sec-fetch-mode'] = 'cors';
        headers['sec-gpc'] = 1;
        let referers;
        switch(storeName) {
            case 'Gamestop':
                headers['x-requested-with'] = 'XMLHttpRequest';
                headers['sec-fetch-site'] = 'same-origin';
                // map referers to console
                referers = {'Microsoft Xbox Series X':'https://www.gamestop.com/video-games/xbox-series-x/consoles/products/xbox-series-x/B224744V.html',
                            'Microsoft Xbox Series S':'https://www.gamestop.com/video-games/xbox-series-x/consoles/products/xbox-series-s-digital-edition/B224746K.html', 
                            'Sony Playstation 5':'https://www.gamestop.com/video-games/playstation-5/consoles/products/playstation-5/11108140.html?condition=New',
                            'Sony Playstation 5 Digital Edition':'https://www.gamestop.com/video-games/playstation-5/consoles/products/playstation-5-digital-edition/11108141.html?condition=New'};
                headers['referer'] = referers[consoleName];
                break;
            case 'Newegg':
                headers['sec-fetch-site'] = 'same-origin';
                referers = {'Microsoft Xbox Series X':'https://www.newegg.com/p/N82E16868105273?Item=N82E16868105273',
                            'Microsoft Xbox Series S':'https://www.newegg.com/p/N82E16868105274?Item=N82E16868105274', 
                            'Sony Playstation 5':'https://www.newegg.com/p/N82E16868110292?Item=N82E16868110292&Description=ps5&cm_re=ps5-_-68-110-292-_-Product&quicklink=true',
                            'Sony Playstation 5 Digital Edition':'https://www.newegg.com/p/N82E16868110295?Item=N82E16868110295&Description=ps5&cm_re=ps5-_-68-110-295-_-Product'};
                headers['referer'] = referers[consoleName];
                break;
            case 'Microsoft':
                headers['sec-fetch-site'] = 'same-site';
                headers['origin'] = 'https://www.microsoft.com';
                headers['referer'] = 'https://www.microsoft.com/';
                break;
        }
    }
    return headers;
}

// extracts stock statuses and product URLs from a retailer API response
// returns an array of parsed stock data for the retailer
function parseData(data,storeName,consoleName) {
    let parsed = []; // array of console stock data from a given retailer (this will only have 1 element for some retailers, multiple for others)
    let stockStatus;
    let url;
    let consoleBySku;
    let sku;
    switch(storeName) {
        case 'Target':
            // 6/07/2021: PS5 listed as in-stock when it is not (probably was at some point). This may be the fix
            stockStatus = data.product.available_to_promise_network.availability.toLowerCase() != "unavailable";
            //stockStatus = !data.product.available_to_promise_network.is_out_of_stock_in_all_online_locations;
            url = data.product.item.buy_url;
            break;
        case 'Gamestop':
            stockStatus = data.product.available;
            url = data['__mccEvents'][0][1][0].url;
            break;
        case 'Newegg':
            stockStatus = data.MainItem.Instock; // Newegg API doesn't provide us with URL, so providing them manually by mapping console to URL
            const urls = {'Microsoft Xbox Series X':'https://www.newegg.com/p/N82E16868105273?Item=N82E16868105273','Microsoft Xbox Series S':'https://www.newegg.com/p/N82E16868105274?Item=N82E16868105274', 'Sony Playstation 5':'https://www.newegg.com/p/N82E16868110292' ,
                          'Sony Playstation 5 Digital Edition':'https://www.newegg.com/p/N82E16868110295'};
            url = urls[consoleName];
            break;
        case 'Walmart': // unlike the above retailers, Walmart's API (and every other retailer below this) allows us to use one call to get information for multiple consoles, so looping through response appropriately
            const consoleById = {'6IGUOXEESSAR':'Microsoft Xbox Series X','4B9GFLRLZYGJ':'Microsoft Xbox Series S', '381J1IR9OWLC':'Sony Playstation 5', '0UDPZF1HYOLP':'Sony Playstation 5 Digital Edition'};
            for(const prod of data.items) {
                stockStatus = prod.canAddToCart && prod.quantity > 5 && prod.sellerName == 'Walmart.com';
                url = "https://walmart.com" + prod.productPageUrl;
                parsed.push({'store': storeName, 'console': consoleById[prod.productId], 'in_stock': stockStatus, 'url': url })
            }
            break;
        case 'Best Buy':
            consoleBySku = {6428324:'Microsoft Xbox Series X', 6430277:'Microsoft Xbox Series S', 6426149:'Sony Playstation 5', 6430161:'Sony Playstation 5 Digital Edition'};
            for(const prod of data.products) {
                stockStatus = prod.onlineAvailability;
                url = prod.url;
                parsed.push({'store': storeName, 'console': consoleBySku[prod.sku], 'in_stock': stockStatus, 'url': url });
            }
            break;
        case 'Microsoft':
            consoleBySku = {'RRT-00001': { 'console':'Microsoft Xbox Series X', 
                                           'url':'https://www.xbox.com/en-us/configure/8wj714n3rbtl?ranMID=24542&ranEAID=k9iPH82yDyA&ranSiteID=k9iPH82yDyA-aMfdx535fcXIPOw7KfBFIg&epi=k9iPH82yDyA-aMfdx535fcXIPOw7KfBFIg&irgwc=1&OCID=AID2000142_aff_7593_1243925&tduid=%28ir__odh0bj2qqokfqgzzkk0sohznyv2xpdgh3mq3nssy00%29%287593%29%281243925%29%28k9iPH82yDyA-aMfdx535fcXIPOw7KfBFIg%29%28%29&irclickid=_odh0bj2qqokfqgzzkk0sohznyv2xpdgh3mq3nssy00'
                                         }, 
                            'RRS-00001': { 'console':'Microsoft Xbox Series S',
                                           'url':'https://www.xbox.com/en-us/configure/942j774tp9jn?ranMID=24542&ranEAID=k9iPH82yDyA&ranSiteID=k9iPH82yDyA-h3DBcVJYjgYPJDfk49Kv0w&epi=k9iPH82yDyA-h3DBcVJYjgYPJDfk49Kv0w&irgwc=1&OCID=AID2000142_aff_7593_1243925&tduid=%28ir__odh0bj2qqokfqgzzkk0sohznyv2xpdgh63q3nssy00%29%287593%29%281243925%29%28k9iPH82yDyA-h3DBcVJYjgYPJDfk49Kv0w%29%28%29&irclickid=_odh0bj2qqokfqgzzkk0sohznyv2xpdgh63q3nssy00'
                                         }
                           };
            for(const item of data.availabilities) {
                const lot = item.availableLots['0001-01-01T00:00:00.0000000Z']['9000000013'];
                stockStatus =  (lot.onlineOrderAvailable.toLowerCase() == 'true') && (lot.inStock.toLowerCase() == 'true');
                sku = item.inventoryControlSkuId;
                // https://www.microsoft.com/en-us/store/b/xboxconsoles?icid=XboxCat_QL1_Consoles
                parsed.push({'store': storeName, 'console':consoleBySku[sku]['console'], 'in_stock': stockStatus, 'url': consoleBySku[sku]['url']});
            }
            break;
        case 'Sony':
            consoleBySku = {'3005816':{'console':'Sony Playstation 5', 'url':'https://direct.playstation.com/en-us/consoles/console/playstation5-console.3005816'}, 
                            '3005817':{'console':'Sony Playstation 5 Digital Edition','url':'https://direct.playstation.com/en-us/consoles/console/playstation5-digital-edition-console.3005817'}};
            for(const item of data.products) {
                sku = item.code;
                stockStatus =  item.purchasable && item.stock.stockLevelStatus.toLowerCase() != 'outofstock';
                parsed.push({'store': storeName, 'console':consoleBySku[sku]['console'], 'in_stock': stockStatus, 'url': consoleBySku[sku]['url']});
            }
    }

    if(!(['Walmart','Best Buy','Microsoft','Sony'].includes(storeName))) { // appending single-item responses to parsed
        parsed.push({'store': storeName, 'console':consoleName, 'in_stock': stockStatus, 'url': url });
    }

    return parsed;
}

// takes parsed store stock data and puts into "buckets" by console
// returns organized dictionary ideal for processing
function organize(promises) {
    let organized = {'Microsoft Xbox Series X':[],'Microsoft Xbox Series S':[],'Sony Playstation 5':[],'Sony Playstation 5 Digital Edition':[]};
    for(const p of promises) {
        if(p.value && p.value.length > 0) {
            for(const item of p.value) {
                organized[item['console']].push({store:item.store, in_stock: item.in_stock, url:item.url});
            }  
        }
    }
    return organized;
}

// wrapper for stock data handling - updates DB, sends stock notifications
function processing(consoleName,data,transporter) {
    return new Promise(async (resolve) => {
        let stockToNotify = await updateStock(consoleName,data);
        if(stockToNotify.length > 0) {
            await sendAlerts(stockToNotify,consoleName,transporter);
        }
        resolve(true); // always resolve true because there's no real need to return anything, any errors that occur are merely printed out
    });
}

// updates database and determines if any stock alerts need to be sent
async function updateStock(consoleName,data) {
    let stockToNotify = []; // if there is new stock for a console, this list contains the necessary store & stock information for generating the alert
    try {
        let row = await Stock.findOne({ console: consoleName }).exec(); // get Stock record for console from DB
        if(!row) { // Stock record doesn't exist for console - create one
            row = new Stock({ console: consoleName });
        }
        for (const item of data) { // cycling through new store data
            let oldStock; // stock status for console @ store currently in the database (before updating)
            storeIndex = row.stores.findIndex(element => {return element.store == item.store}); 
            if(storeIndex != -1) { 
                oldStock = row.stores[storeIndex].in_stock;
            }
            else { // store data doesn't exist for this console - initialize it
                oldStock = false;
                row.stores.push({});
                storeIndex = row.stores.length - 1;
            }

            // getting the last time the console was seen in stock at this store (before potentially updating value)
            // if doesn't exist, then the console's never been in stock here (set to epoch as placeholder)
            //const last_time_in_stock_at_store = row.stores[storeIndex].last_time_in_stock ? new Date(row.stores[storeIndex].last_time_in_stock) : new Date(null);
            const now = Date.now();
            //const time_since_last_stock = now - last_time_in_stock_at_store; // calculating the # of milliseconds between now and the last time a console was seen in stock at this store

            // set new data
            row.stores[storeIndex].store = item.store;
            row.stores[storeIndex].in_stock = item.in_stock;
            row.stores[storeIndex].url = item.url;
            if(item.in_stock) {
                row.stores[storeIndex].last_time_in_stock = now;
            }

            // if the console was previously out-of-stock, and now is in-stock at this store, then typically a stock alert for this console is to be sent
            // ...unless there was stock less than IGNORE_ALERT_WITHIN milliseconds ago, in which case do not send. 
            // This is to cut down on "spammy" emails as consoles often float in and out of stock when they're available.
            //const IGNORE_ALERT_WITHIN = 900000; // 15 minutes
            //const willNotify = !oldStock && item.in_stock && time_since_last_stock > IGNORE_ALERT_WITHIN;
            const willNotify = !oldStock && item.in_stock;
            if(willNotify) {
                stockToNotify.push(item);
            }

            console.log(consoleName.padEnd(34,' '),"@",item.store.padEnd(9,' '),
                        (item.in_stock) ? '\x1b[32m\x1b[1mIn Stock\x1b[0m'.padEnd(25, ' ') : '\x1b[31m\x1b[1mOut of Stock\x1b[0m',
                        (willNotify) ? "\x1b[34mWill notify.\x1b[0m" : "");
        }
        await row.save(); // commit updates
    }
    catch(err) {
        console.log(err.message);
    }
    return stockToNotify;
}

// composes and sends stock notification for a newly-in-stock console
async function sendAlerts(data,consoleName,transporter) {
    try {
        // map console name to console preferences in DB's User collection
        let pref_ref = {'Microsoft Xbox Series X':'series_x','Microsoft Xbox Series S':'series_s','Sony Playstation 5':'ps5','Sony Playstation 5 Digital Edition':'ps5d'};
        let toFind = {}; 
        toFind['prefs.'+pref_ref[consoleName]] = true; // generating User query filter - limiting to users who want notifications for this console
        const mailing_list = (await User.find(toFind,['email']).exec()).map(user => {return user.email; }); // get list of emails opted in to receive stock updates for the given console
        if(mailing_list.length > 0) { // only send email when there is at least 1 user signed up for alerts for that console
            const subject = consoleName + " Stock Notification";
            const text = generateText(data,consoleName);
            let message = {
                from: `"Console Stock Tracker" <${process.env.EMAIL_ADDR}>`,
                to: `${process.env.EMAIL_ADDR}`, // sending to self for record purposes and to hide actual recipient list
                bcc: mailing_list, // BCCing all recipients so mailing list is not visible to users (there's sometimes limits how many people can be BCC'd, so may not be an ideal scalable solution)
                subject: subject,
                text: text.plain,
                html: text.html
            };
            await transporter.sendMail(message);
        }
    }
    catch {
        console.log("Error sending email:",error);
    }
}

// generate HTML and plaintext versions of notification email
function generateText(data,consoleName) {
    let plainText = `The ${consoleName} has been seen in stock at the following retailers:\n`;
    let htmlText = `<p>The <b>${consoleName}</b> has been seen <b>in stock</b> at the following retailers:</p><ul>`;
    for(const item of data) {
        plainText += `\n${item.store}: ${item.url}`;
        htmlText += `<li><a href="${item.url}">${item.store}</a></li>`;
    }
    htmlText += '</ul>';
    const webapp_url = process.env.NODE_ENV == 'production' ? process.env.PROD_WEBAPP_URL : process.env.DEV_WEBAPP_URL; // link to webapp in email (url depends on environment)
    plainText += `\n\nThis stock alert was generated by Console Stock Tracker: ${webapp_url}`;
    htmlText += `This stock alert was generated by <a href="${webapp_url}">Console Stock Tracker</a>.`;
    return {plain: plainText, html: htmlText};
}

// connect to email server for sending stock notifications
function initializeEmail() {
    return nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: process.env.EMAIL_PORT,
        secure: false,
        auth: {
            user: process.env.EMAIL_ADDR,
            pass: process.env.EMAIL_PASS
        }
    });
}

// wrapper function for entire process - called in Express server
function main() {
    // links used to gather stock data
    const BESTBUY = `https://api.bestbuy.com/v1/products(sku in(6428324,6430277,6426149,6430161))?format=json&show=sku,name,onlineAvailability,url&apiKey=${process.env.BESTBUY_API}`;
    const WALMART_XBOX = 'https://www.walmart.com/search/api/preso?query=6IGUOXEESSAR+4B9GFLRLZYGJ';
    const WALMART_PS = 'https://www.walmart.com/search/api/preso?query=381J1IR9OWLC+0UDPZF1HYOLP';
    const MICROSOFT_XBOX = 'https://inv.mp.microsoft.com/v2.0/inventory/US?MS-CorrelationId=9d30df7e-6be0-47d5-9a56-d12964eac90f&MS-RequestId=9d30df7e-6be0-47d5-9a56-d12964eac90f&mode=continueOnError';
    const SONY_PS = 'https://api.direct.playstation.com/commercewebservices/ps-direct-us/users/anonymous/products/productList?fields=BASIC&productCodes=3005816,3005817';
    const TARGET_X = `https://redsky.target.com/v3/pdp/tcin/80790841?excludes=taxonomy,price,promotion,bulk_ship,rating_and_review_reviews,rating_and_review_statistics,question_answer_statistics&key=${process.env.TARGET_API}`;
    const TARGET_S = `https://redsky.target.com/v3/pdp/tcin/80790842?excludes=taxonomy,price,promotion,bulk_ship,rating_and_review_reviews,rating_and_review_statistics,question_answer_statistics&key=${process.env.TARGET_API}`;
    const TARGET_PS5 = `https://redsky.target.com/v3/pdp/tcin/81114595?excludes=taxonomy,price,promotion,bulk_ship,rating_and_review_reviews,rating_and_review_statistics,question_answer_statistics&key=${process.env.TARGET_API}`;
    const TARGET_PS5D = `https://redsky.target.com/v3/pdp/tcin/81114596?excludes=taxonomy,price,promotion,bulk_ship,rating_and_review_reviews,rating_and_review_statistics,question_answer_statistics&key=${process.env.TARGET_API}`;
    const GAMESTOP_X = 'https://www.gamestop.com/on/demandware.store/Sites-gamestop-us-Site/default/Product-Variation?pid=B224744V&redesignFlag=true&rt=productDetailsRedesign';
    const GAMESTOP_S = 'https://www.gamestop.com/on/demandware.store/Sites-gamestop-us-Site/default/Product-Variation?pid=B224746K&redesignFlag=true&rt=productDetailsRedesign';
    const GAMESTOP_PS5 = 'https://www.gamestop.com/on/demandware.store/Sites-gamestop-us-Site/default/Product-Variation?dwvar_11108140_condition=New&pid=11108140&quantity=1&redesignFlag=true&rt=productDetailsRedesign';
    const GAMESTOP_PS5D = 'https://www.gamestop.com/on/demandware.store/Sites-gamestop-us-Site/default/Product-Variation?dwvar_11108141_condition=New&pid=11108141&quantity=1&redesignFlag=true&rt=productDetailsRedesign';
    const NEWEGG_X = 'https://www.newegg.com/product/api/ProductRealtime?ItemNumber=68-105-273&RecommendItem=&BestSellerItemList=&IsVATPrice=true';
    const NEWEGG_S = 'https://www.newegg.com/product/api/ProductRealtime?ItemNumber=68-105-274&RecommendItem=&BestSellerItemList=9SIA378DSX1815&IsVATPrice=true';
    const NEWEGG_PS5 = 'https://www.newegg.com/product/api/ProductRealtime?ItemNumber=68-110-292&RecommendItem=&BestSellerItemList=&IsVATPrice=true';
    const NEWEGG_PS5D = 'https://www.newegg.com/product/api/ProductRealtime?ItemNumber=68-110-295&RecommendItem=&BestSellerItemList=&IsVATPrice=true';

    if (mongoose.connection.readyState != 1) { // not connected to database, can't continue
        console.log("Script is not connected to MongoDB. Aborting...");
    }
    else {
        // connect to email server
        const transporter = initializeEmail(); 
        // fire off all API requests asynchronously, but wait until they're all done
        Promise.allSettled([gather(BESTBUY, 'All Xboxes', 'Best Buy'),
                            gather(MICROSOFT_XBOX,'All Xboxes','Microsoft'),
                            gather(SONY_PS,'All Playstations','Sony'),
                            gather(WALMART_XBOX, 'All Xboxes', 'Walmart'), gather(WALMART_PS, 'All Playstations', 'Walmart'),
                            gather(TARGET_X, 'Microsoft Xbox Series X', 'Target'), gather(TARGET_S, 'Microsoft Xbox Series S', 'Target'), 
                            gather(TARGET_PS5, 'Sony Playstation 5', 'Target'), gather(TARGET_PS5D, 'Sony Playstation 5 Digital Edition', 'Target'),
                            //gather(GAMESTOP_X, 'Microsoft Xbox Series X', 'Gamestop'), gather(GAMESTOP_S, 'Microsoft Xbox Series S', 'Gamestop'), 
                            //gather(GAMESTOP_PS5, 'Sony Playstation 5', 'Gamestop'), gather(GAMESTOP_PS5D, 'Sony Playstation 5 Digital Edition', 'Gamestop'),
                            gather(NEWEGG_X, 'Microsoft Xbox Series X', 'Newegg'), gather(NEWEGG_S, 'Microsoft Xbox Series S', 'Newegg'), 
                            gather(NEWEGG_PS5, 'Sony Playstation 5', 'Newegg'), gather(NEWEGG_PS5D, 'Sony Playstation 5 Digital Edition', 'Newegg')])
        .then(unorganized => {
            let organized = organize(unorganized); // sort initial store data by console
            // processing each console asynchronously, but wait until they're all done
            return Promise.allSettled([processing('Microsoft Xbox Series X',organized['Microsoft Xbox Series X'],transporter),
                                       processing('Microsoft Xbox Series S',organized['Microsoft Xbox Series S'],transporter),
                                       processing('Sony Playstation 5',organized['Sony Playstation 5'],transporter),
                                       processing('Sony Playstation 5 Digital Edition',organized['Sony Playstation 5 Digital Edition'],transporter)]);
        })
        .then(() => {
            transporter.close(); // disconnect email
            return LastRun.updateMany({}, {last_runtime: Date.now()}, {upsert: true}); // update last-updated timestamp
        })
        .then(() => {
            console.log("\x1b[1m\x1b[33mComplete\x1b[0m\n");
        }) 
    }
}

module.exports = { main };