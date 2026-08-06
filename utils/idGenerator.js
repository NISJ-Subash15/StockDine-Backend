const generateCustomerId = () => {
    const randomDigits = Math.floor(100000 + Math.random() * 900000);
    return `CUST-${randomDigits}`;
};

const generateRestaurantId = () => {
    const randomDigits = Math.floor(100000 + Math.random() * 900000);
    return `REST-${randomDigits}`;
};

module.exports = {
    generateCustomerId,
    generateRestaurantId,
};
