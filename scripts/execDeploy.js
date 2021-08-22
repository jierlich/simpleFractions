const config = require('./config')
const deploy = require('./deploy')

deploy(config)
    .then(() => process.exit(0))
    .catch(error => {
        console.log(error)
        process.exit(1)
    })
