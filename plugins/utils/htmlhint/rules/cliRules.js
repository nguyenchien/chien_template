module.exports = function(HTMLHint) {
  const classValue = require('../classValue');
  HTMLHint.addRule(classValue);
}