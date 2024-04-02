const timeout = (ms, message = 'Timeout') => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      reject(new Error(message));
    }, ms);
  });
};

module.exports = timeout;
