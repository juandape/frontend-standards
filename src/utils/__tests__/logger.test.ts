import { Logger } from '../logger';

describe('Logger', () => {
  it('does not log debug if logger is not verbose (currentLevel < DEBUG)', () => {
    const nonVerboseLogger = new Logger(false); // currentLevel = INFO
    const spyLog2 = jest.spyOn(console, 'log').mockImplementation(() => {});
    nonVerboseLogger.debug('should not log', { foo: 6 });
    expect(spyLog2).not.toHaveBeenCalled();
    spyLog2.mockRestore();
  });
  it('logs debug only once if details is 0', () => {
    logger.setLevel('DEBUG');
    logger.debug('debug zero', 0);
    expect(spyLog).toHaveBeenCalledTimes(1);
    expect(spyLog).toHaveBeenCalledWith(expect.stringContaining('debug zero'));
  });

  it('logs debug only once if details is empty string', () => {
    logger.setLevel('DEBUG');
    logger.debug('debug empty', '');
    expect(spyLog).toHaveBeenCalledTimes(1);
    expect(spyLog).toHaveBeenCalledWith(expect.stringContaining('debug empty'));
  });

  it('logs debug only once if details is false', () => {
    logger.setLevel('DEBUG');
    logger.debug('debug false', false);
    expect(spyLog).toHaveBeenCalledTimes(1);
    expect(spyLog).toHaveBeenCalledWith(expect.stringContaining('debug false'));
  });
  let logger: Logger;
  let spyError: jest.SpyInstance;
  let spyWarn: jest.SpyInstance;
  let spyLog: jest.SpyInstance;

  beforeEach(() => {
    spyError = jest.spyOn(console, 'error').mockImplementation(() => {});
    spyWarn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    spyLog = jest.spyOn(console, 'log').mockImplementation(() => {});
    logger = new Logger(true);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('logs error', () => {
    logger.error('err', { foo: 1 });
    expect(spyError).toHaveBeenCalledWith(expect.stringContaining('err'));
  });

  it('logs warn', () => {
    logger.warn('warn', { foo: 2 });
    expect(spyWarn).toHaveBeenCalledWith(expect.stringContaining('warn'));
  });

  it('logs info', () => {
    logger.info('info', { foo: 3 });
    expect(spyLog).toHaveBeenCalledWith(expect.stringContaining('info'));
  });

  it('logs debug', () => {
    logger.debug('debug', { foo: 4 });
    expect(spyLog).toHaveBeenCalledWith(expect.stringContaining('debug'));
  });

  it('withPrefix adds prefix', () => {
    const child = logger.withPrefix('PREF');
    child.info('msg');
    expect(spyLog).toHaveBeenCalledWith(expect.stringContaining('[PREF] msg'));
  });

  it('setLevel and isLevelEnabled work', () => {
    logger.setLevel('ERROR');
    expect(logger.isLevelEnabled('ERROR')).toBe(true);
    expect(logger.isLevelEnabled('DEBUG')).toBe(false);
  });

  it('no log when debug level is not enabled', () => {
    logger.setLevel('INFO'); // DEBUG > INFO, así que no debe loguear
    logger.debug('should not log', { foo: 5 });
    expect(spyLog).not.toHaveBeenCalledWith(
      expect.stringContaining('should not log')
    );
  });

  it('logs debug only once if details is null/undefined', () => {
    logger.setLevel('DEBUG');
    logger.debug('debug once');
    // Solo debe llamar una vez a console.log (el mensaje, no los detalles)
    expect(spyLog).toHaveBeenCalledTimes(1);
    expect(spyLog).toHaveBeenCalledWith(expect.stringContaining('debug once'));
  });
});
