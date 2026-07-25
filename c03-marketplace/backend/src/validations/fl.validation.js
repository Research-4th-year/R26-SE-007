const Joi = require("joi");

const predict = {

    body: Joi.object().keys({

        district: Joi.string().valid("ampara","badulla","kandy","monaragala").required(),

        paddyType: Joi.string().required(),

        season: Joi.string().valid("maha","yala").required(),

        quantity: Joi.number().positive().required()

    })

};

module.exports = {
    predict
};