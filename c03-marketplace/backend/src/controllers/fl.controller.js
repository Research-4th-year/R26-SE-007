const catchAsync = require("../utils/catchAsync");
const { flService } = require("../services");

const predictPrice = catchAsync(async (req, res) => {

    const prediction = await flService.predictPrice(req.body);

    res.send({
        success: true,
        data: prediction
    });

});

module.exports = {
    predictPrice
};