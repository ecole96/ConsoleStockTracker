# Console Stock Tracker
Console Stock Tracker is a webapp / service that keeps track of Microsoft Xbox Series S|X and Sony Playstation 5 (standard and Digital Edition) stock across various retailers and enables users to receive instant in-stock email notifications for the consoles they want. It is currently accessible at https://www.consolestocktracker.live/ and was developed by Evan Cole as a MERN-stack (MongoDB / Express / React / NodeJS) application.

UPDATE APRIL 2021: This project has been discontinued. Just to show how it looked, here is a screenshot of the site in action before its discontinuation: https://i.imgur.com/vRqFamO.png

## How It Works
The application consists of two parts: 
* the back-end on the server, which polls console stock every minute by calling retailer APIs (aggregating necessary data into the app's own database and API) and sending any in-stock alerts if encountered (these are triggered when the previous run was out-of-stock and the current run is in-stock).
* the front-end in the web browser, which continually pulls stock data from the back-end in order to display live results. It also allows users to sign up for in-stock alerts by entering their email; they can select which consoles to receive alerts for. Users may update their console preferences or cancel alerts at any time.

## Retailers Supported
* Wal-Mart
* Best Buy
* Target
* Newegg (for the Playstations, only bundles are stocked)
* Microsoft Store (Xboxes only)
* Sony Direct (Playstations only)

## Known Issues
* Walmart stock may not always be accurate - small quantities (often single-digits according to their API) are allegedly stocked occasionally, but they're either sold out instantly or were never actually available. Doubtful much can be done here, as it's seemingly on WM's end.
* Best Buy sometimes lists a console as in-stock (and allows you to add it to cart) but does not allow for delivery, only pick-up at certain stores.
* When a console comes in stock, it may float in and out of availability due to high demand and retailer site volume - this may result in multiple email alerts in a short period of time. As stock instances come in over time, avenues may be explored to cut down on these "spammy" emails.
* All the infrastructure is there to support Gamestop data - it works locally, but in production the web server is blocked by them, even when behind a proxy. Not optimistic about this.
* Currently, stock alerts are sent via a Gmail account and are subject to its limitations. Should the app's user count expand, more scalable solutions may be explored.

## Credits
* Console images courtesy of Microsoft and Sony
* Stock data and retailer links courtesy of Wal-Mart, Best Buy, Target, Newegg, Microsoft, and Sony
* App logo assets courtesy of Font Awesome
