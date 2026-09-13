module.exports = function (config) {
  config.set({
    frameworks: ['jasmine'],
    plugins: [require('karma-jasmine'), require('karma-chrome-launcher')],
    reporters: ['dots'],
    customLaunchers: {
      ChromeHeadlessMobile: { base: 'ChromeHeadless', flags: ['--window-size=390,844', '--force-device-scale-factor=1'] },
    },
    browsers: ['ChromeHeadlessMobile'],
    singleRun: true,
    client: { jasmine: { random: false }, viewport: 'mobile' },
  });
};
