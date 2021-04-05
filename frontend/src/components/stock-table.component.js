import React, { Component } from 'react';

export default class StockTable extends Component {
    render() {
        let rows = [];
        for(const row of this.props.table_data.stores) { // dynamically generating table rows
            let stockText = row.in_stock ? {text: "In Stock", class:"badge-success"} : {text: "Out of Stock", class:"badge-danger"}; // generate data for stock status rendering
            let convertedDate = row.hasOwnProperty('last_time_in_stock') ? new Date(row.last_time_in_stock).toLocaleString('en-US') : "Never"; // date last seen in stock
            rows.push(<tr key={row.store}>
                        <td>{row.store}</td>
                        <td><h5><a className={`badge ${stockText.class}`} href={row.url} target="_blank" rel="noreferrer noopener">{stockText.text}</a></h5></td>
                        <td>{convertedDate}</td>
                     </tr>);
        }
        // dictionary to map table header color and console information URLs to console names
        const headerDict = {'Microsoft Xbox Series X':{'class':"table-success",'url':'https://www.xbox.com/en-US/consoles/xbox-series-x'},
                            'Microsoft Xbox Series S':{'class':'table-light','url':'https://www.xbox.com/en-US/consoles/xbox-series-s'},
                            'Sony Playstation 5':{'class':'table-primary','url':'https://www.playstation.com/en-us/ps5/'},
                            'Sony Playstation 5 Digital Edition':{'class':'table-info','url':'https://www.playstation.com/en-us/ps5/'}}
        const consoleName = this.props.table_data.console;
        return (
            <table className="table table-dark">
                <thead>
                    <tr>
                        <th colSpan="3" className={`${headerDict[consoleName]['class']} text-dark`}>
                            <h5><a className='text-dark' href={headerDict[consoleName]['url']} target="_blank" rel="noreferrer noopener">{consoleName}</a></h5>
                        </th>
                    </tr>
                    <tr>
                        <th>Store</th>
                        <th>Status</th>
                        <th>Last Time In Stock</th>
                    </tr>
                </thead>
                <tbody>
                    {rows}
                </tbody>
            </table>
        );
    }
}