const rejectTimeout = (ms, message = 'Timeout') => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      reject(new Error(message));
    }, ms);
  });
};

const resolveTimeout = async (ms, value) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(value);
    }, ms);
  });
};

module.exports = {
  reject: rejectTimeout,
  resolve: resolveTimeout
};
