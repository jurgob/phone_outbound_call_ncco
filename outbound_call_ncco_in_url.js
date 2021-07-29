/**
nexmo context: 
you can find this as the second parameter of rtcEvent funciton or as part or the request in req.nexmo in every request received by the handler 
you specify in the route function.

it contains the following: 
const {
        generateBEToken,
        generateUserToken,
        logger,
        csClient,
        storageClient
} = nexmo;

- generateBEToken, generateUserToken,// those methods can generate a valid token for application
- csClient: this is just a wrapper on https://github.com/axios/axios who is already authenticated as a nexmo application and 
    is gonna already log any request/response you do on conversation api. 
    Here is the api spec: https://jurgob.github.io/conversation-service-docs/#/openapiuiv3
- logger: this is an integrated logger, basically a bunyan instance
- storageClient: this is a simple key/value inmemory-storage client based on redis

*/

function generateInitialNCCO(){
    const ncco = [
        // {
        //     "action": "connect",
        //     randomFromNumber: true,
        //     "eventType": "synchronous",
        //     "endpoint": [
        //         {
        //         "type": "phone",
        //         "number": `${number2call}`,
        //         }
        //     ],
        // },
        {
            "action": "talk",
            "text": "You are listening to a Call made with Voice API"
        },
        {
            "action": "talk",
            "text": "Wendy sono a home, sweet home"
        },
        {
            "action": "talk",
            "text": "Sta scena e' cosi dolce che sembra una sweet come"
        }
    ]

    return ncco
}


const voiceEvent = async (req, res, next) => {
    const {
        logger,
        config
    } = req.nexmo;

    // const number2call = req.body.from
    const status = req.body.status

    // let ncco = null
    // if(status == "answered") {
    //     ncco = generateInitialNCCO()
    // }
    // logger.info( { callStatus: status, body: req.body, ncco: JSON.stringify(ncco, null, '  ') }, '** voiceEvent ncco request/ response')
    
    // if(ncco){
    //     return res.json(ncco)
    // } else {
    //     res.status(200).end()
    // }

    logger.info( { callStatus: status, body: req.body, }, '** voiceEvent ncco request/ response')
    res.status(200).end()
    
}

const voiceAnswer = async (req, res, next) => {
    
    const {
        logger,
        config
    } = req.nexmo;

    const number2call = req.body.from

    const ncco = generateInitialNCCO()
    
    logger.info({body: JSON.stringify(req.body, null, '  '), ncco}, '== voiceAnswer request')
    
    res.json(ncco)
}


/** 
 * 
 * This function is meant to handle all the asyncronus event you are gonna receive from conversation api 
 * 
 * it has 2 parameters, event and nexmo context
 * @param {object} event - this is a conversation api event. Find the list of the event here: https://jurgob.github.io/conversation-service-docs/#/customv3
 * @param {object} nexmo - see the context section above
 * */

const DATACENTER = `https://api.nexmo.com` 


/**
 * 
 * @param {object} app - this is an express app
 * you can register and handler same way you would do in express. 
 * the only difference is that in every req, you will have a req.nexmo variable containning a nexmo context
 * 
 */
const route =  (app) => {
    app.get('/startCall/:number', async (req, res) => {

        const {
            logger,
            csClient,
            config
        } = req.nexmo;

        logger.info(`Start Call: `, req.params)

        const number2call = req.params.number

        const reqNewCall = {
            "url":`${DATACENTER}/v1/calls`,
            "method": "post",
            data:{
                "to": [
                    {
                        "type": "phone",
                        "number": `${number2call}`
                    }
                ],
                "random_from_number": true,
                "event_url": [`${config.server_url}/webhook/voiceEvent`],
                "answer_url": [`${config.server_url}/webhook/voiceAnswer`],
                "answer_method": "POST"

            }
        }

        const callRes = await csClient(reqNewCall)

        res.json({
            request: reqNewCall,
            response: callRes.data
        })
    })
}



module.exports = {
    voiceEvent,
    voiceAnswer,
    route
}