const { getUserData, updateUserData } = require('../utils/helpers.js');

const DAILY_REWARD = 100; // Amount of coins for daily reward
const COOLDOWN_PERIOD = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

async function claimDailyReward(userId) {
    const userData = await getUserData(userId);
    
    if (!userData) {
        throw new Error('User not found. Please start your journey first!');
    }

    const now = Date.now();
    const lastClaim = userData.lastDaily ? new Date(userData.lastDaily).getTime() : 0;

    if (now - lastClaim < COOLDOWN_PERIOD) {
        const timeLeft = COOLDOWN_PERIOD - (now - lastClaim);
        const hoursLeft = Math.floor(timeLeft / (60 * 60 * 1000));
        const minutesLeft = Math.floor((timeLeft % (60 * 60 * 1000)) / (60 * 1000));
        throw new Error(`You can claim your next daily reward in ${hoursLeft} hours and ${minutesLeft} minutes.`);
    }

    userData.money += DAILY_REWARD;
    userData.lastDaily = now;

    await updateUserData(userId, userData);

    return {
        reward: DAILY_REWARD,
        newBalance: userData.money
    };
}

function getTimeUntilNextReward(lastClaimTime) {
    const now = Date.now();
    const timeSinceClaim = now - lastClaimTime;
    
    if (timeSinceClaim >= COOLDOWN_PERIOD) {
        return { canClaim: true };
    } else {
        const timeLeft = COOLDOWN_PERIOD - timeSinceClaim;
        const hoursLeft = Math.floor(timeLeft / (60 * 60 * 1000));
        const minutesLeft = Math.floor((timeLeft % (60 * 60 * 1000)) / (60 * 1000));
        return { 
            canClaim: false, 
            timeLeft: `${hoursLeft} hours and ${minutesLeft} minutes`
        };
    }
}

module.exports = {
    claimDailyReward,
    getTimeUntilNextReward,
    DAILY_REWARD
};