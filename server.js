const express = require('express');
const axios = require('axios'); // For making HTTP requests

const app = express();

const WINDOW_SIZE = 10;
let numbers = [];

async function fetchNumberFromThirdPartyServer(numberId) {
  try {
    const response = await axios.get(`https://localhost:9876/numbers/${numberId}`); // Replace with actual API endpoint
    if (response.status === 200 && response.data.number) {
      const fetchedNumber = response.data.number;
      if (response.data.responseTime > 500) {
        console.warn(`Number ${numberId} fetch time exceeded 500ms, potentially discarding`);
      }
      return fetchedNumber;
    }
    return null;
  } catch (error) {
    console.error(`Error fetching number ${numberId}:`, error);
    return null;
  }
}

function storeNumber(number) {
  if (!numbers.includes(number)) {
    if (numbers.length < WINDOW_SIZE) {
      numbers.push(number);
    } else {
      numbers.shift();
      numbers.push(number);
    }
  }
}

function calculateAverage() {
  if (numbers.length === 0) return null;
  const sum = numbers.reduce((acc, num) => acc + num, 0);
  return sum / numbers.length;
}

app.get('/numbers/:numberid', async (req, res) => {
  const numberId = req.params.numberid;

  const fetchedNumber = await fetchNumberFromThirdPartyServer(numberId);
  if (fetchedNumber) {
    storeNumber(fetchedNumber);
  }

  const windowPrevState = numbers.slice(0, numbers.length - 1);
  const windowCurrState = numbers;
  const avg = calculateAverage();

  res.json({
    windowPrevState,
    windowCurrState,
    numbers: fetchedNumber ? [fetchedNumber] : [],
    avg,
  });
});

app.listen(9876, () => {
  console.log('Server listening on port 9876');
});
