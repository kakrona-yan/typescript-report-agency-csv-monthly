import { Sequelize } from 'sequelize'

export const getConnection = (
        option: { 
            logging: boolean 
        } = {
            logging: true
        }
    ): Sequelize => {
    // return new Sequelize({
    //     dialect: 'mysql',
    //     host: '52.197.209.5',
    //     username: 'getsugaku_dev_cluster',
    //     password: 'qX%F6Vrk3^XqwW3b',
    //     database: 'getsugaku'
    // })
    return new Sequelize({
        dialect: 'mysql',
        host: 'cluster-getsugaku-prod.cluster-ro-cy1xtwkbfr7h.ap-northeast-1.rds.amazonaws.com',
        port: 3306,
        username: 'getsugaku_reader',
        password: '9X$s59DYj!5YW6W$',
        database: 'getsugaku',
        logging: option.logging
    })
}
