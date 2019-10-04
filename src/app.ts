import { getConnection } from "./db";
import { QueryTypes } from "sequelize";
import { str_pad } from './helper'
import moment from 'moment-timezone'
import { Sequelize } from 'sequelize'
import Bluebird from "bluebird";

class App {
    startDate: string;
    endDate: any;
    db: Sequelize;
    constructor() {
        console.time('App')

        this.startDate = '2019-09-01 00:00:00'
        this.endDate = moment(this.startDate)
        this.endDate.month(this.endDate.month() + 1)
        this.endDate = this.endDate.format('YYYY-MM-DD 00:00:00')
        this.db = getConnection({logging: false})
    }

    // 2019-09
    async startProcess() {

        const agencies = await this.db.query(`SELECT * FROM m_agencies`, { type: QueryTypes.SELECT })
        const agencyProducts = await this.db.query(`SELECT * FROM t_agency_products WHERE agency_id IN (${agencies.map(it => it['id']).join(',')})`, { type: QueryTypes.SELECT })

        const tmp: {agencyCode: string, agencyId: string, orderCount: number, description: string}[] = []

        for (const agency of agencies) {
            const orders = await this.db.query(`SELECT * FROM t_orders 
            WHERE agency_product_id LIKE '${str_pad(agency['id'], 4, '0')}%'
            AND (canceled_at >= '${this.startDate}' OR canceled_at IS NULL)
            AND created_at < '${this.endDate}'
            AND exists (
                SELECT
                    ap.id,
                    ap.charge_period
                FROM
                    t_agency_products ap
                WHERE
                    t_orders.agency_product_id = ap.id
                    AND ap.charge_period > 0
            )
            ORDER BY id DESC
            `, { type: QueryTypes.SELECT })

            const paymentHistories = await this.getPaymentHistories(orders.map(it => it['id']));
            for (const order of orders) {
                const agencyProduct = agencyProducts.find(it => it['agency_id'] == agency['id']) || {}
                const chargePeriod = agencyProduct['charge_period']
                const ph = paymentHistories.find(it => it['order_id'] == order['id']) || { paid_count: 0 }
                const isFee = this.isNoFeeOfAgency(chargePeriod, ph['paid_count'])

                if(isFee) {
                    // count
                    if(!tmp.find(it => it.agencyId == agency['id'])) {
                        const data = {
                            agencyId: agency['id'],
                            agencyCode: agency['agency_code'],
                            orderCount: orders.length,
                            description: `Agency id: ${str_pad(agency['id'], 4, '0')} code ${agency['agency_code']} has ${orders.length} orders`,
                        }
                        tmp.push(data)
                        console.log(`${data.agencyId},${data.agencyCode},${data.orderCount}`);
                        break;
                    }
                }
            }
        }
        console.log(`tmp.length = ${tmp.length}`);
        await this.db.close()
    }

    getPaymentHistories(orderIds: string[]) {
        if (orderIds.length == 0) return [];
        return this.db.query(`SELECT id, 
                order_id, 
                payment_type, 
                amount, 
                rate, 
                paid_at,
                paid_count
            FROM 
                t_payment_histories 
            WHERE 
                order_id IN (${orderIds.join(',')})
            ORDER BY paid_at DESC
            `, { type: QueryTypes.SELECT })
    }
    isNoFeeOfAgency(chargePeriod: number, paidCount: number) {
        return (chargePeriod < paidCount || paidCount == 0) ? false : true;
    }
}

new App().startProcess().then(() => {
    console.timeEnd('App')
})
