const urlBase64Decode = function (str) {
  let output = str.replace(/-/g, '+').replace(/_/g, '/');
  switch (output.length % 4) {
    case 0: { break; }
    case 2: { output += '=='; break; }
    case 3: { output += '='; break; }
    default: {
      throw new Error('Illegal base64url string!');
    }
  }
  return decodeURIComponent(Buffer.from(output, 'base64').toString('utf8'));
};

module.exports.decodeToken = function (token) {
  const parts = token.split('.');

  if (parts.length !== 3) {
    throw new Error('JWT must have 3 parts');
  }

  const decoded = urlBase64Decode(parts[1]);
  if (!decoded) {
    throw new Error('Cannot decode the token');
  }

  return JSON.parse(decoded);
};
