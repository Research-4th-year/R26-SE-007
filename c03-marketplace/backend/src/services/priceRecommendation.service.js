const getRecommendation = (expectedPrice, predictedPrice) => {

    const difference = expectedPrice - predictedPrice;

    let english = "";
    let sinhala = "";

    if (Math.abs(difference) <= 5) {

        english =
            `The AI predicted market price is Rs.${predictedPrice.toFixed(2)} per kg. Your expected price is very close to the current market value. You can confidently proceed with this price.`;

        sinhala =
            `AI මගින් පුරෝකථනය කළ වෙළඳපොළ මිල කිලෝග්‍රෑමයකට රු.${predictedPrice.toFixed(2)} කි. ඔබ ලබා දී ඇති අපේක්ෂිත මිල වර්තමාන වෙළඳපොළ මිලට ඉතා සමීප බැවින් මෙම මිල භාවිතා කිරීම සුදුසුය.`;

    }

    else if (expectedPrice > predictedPrice) {

        english =
            `The AI predicted market price is Rs.${predictedPrice.toFixed(2)} per kg. Your expected price is higher than the estimated market value. A slightly lower price may increase the chances of finding suitable millers.`;

        sinhala =
            `AI මගින් පුරෝකථනය කළ වෙළඳපොළ මිල කිලෝග්‍රෑමයකට රු.${predictedPrice.toFixed(2)} කි. ඔබ ලබා දී ඇති මිල වෙළඳපොළ ඇස්තමේන්තුගත මිලට වඩා වැඩිය. මිල සුළු වශයෙන් අඩු කළහොත් ගැළපෙන වී මෝල්කරුවන් සොයා ගැනීමේ හැකියාව වැඩි වේ.`;

    }

    else {

        english =
            `The AI predicted market price is Rs.${predictedPrice.toFixed(2)} per kg. Your expected price is lower than the estimated market value. You may consider increasing your price to achieve a better profit.`;

        sinhala =
            `AI මගින් පුරෝකථනය කළ වෙළඳපොළ මිල කිලෝග්‍රෑමයකට රු.${predictedPrice.toFixed(2)} කි. ඔබ ලබා දී ඇති මිල වෙළඳපොළ ඇස්තමේන්තුගත මිලට වඩා අඩුය. වැඩි ලාභයක් ලබා ගැනීම සඳහා මිල වැඩි කිරීම සලකා බැලිය හැකිය.`;

    }

    return {
        english,
        sinhala
    };

};

module.exports = {
    getRecommendation
};