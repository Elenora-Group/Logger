import path from 'path';
import fs from 'fs';
import { inspect } from 'util';
import { DateTime } from 'luxon';
import chalk from 'chalk';
import StackTrace from 'stacktrace-js';

export enum LEVEL {
  debug = 0,
  info,
  success,
  warning,
  error,
  notice,
}

export const LEVEL_TAG = {
  [LEVEL.debug]: ' debug ',
  [LEVEL.info]: ' info  ',
  [LEVEL.success]: 'success',
  [LEVEL.warning]: 'warning',
  [LEVEL.error]: ' error ',
  [LEVEL.notice]: 'notice ',
};

export const LEVEL_COLOR = {
  [LEVEL.debug]: chalk.gray(' debug '),
  [LEVEL.info]: chalk.blue(' info  '),
  [LEVEL.success]: chalk.greenBright('success'),
  [LEVEL.warning]: chalk.yellowBright('warning'),
  [LEVEL.error]: chalk.redBright(' error '),
  [LEVEL.notice]: chalk.bgRedBright('notice '),
};

export class Logger {
  private constructor() {}
  private logPath = path.join(process.cwd(), 'logs');
  private doWrite = true;

  private _level = LEVEL.info;

  private _timeFormat = 'D TT';

  private _format = '{time} [{level}] {content}';

  /**
   * Create a new instance
   *
   * @static
   * @return {*}
   * @memberof Logger
   */
  public static createInstance() {
    return new Logger();
  }

  /**
   * Get the log directory
   *
   * @memberof Logger
   */
  public get path() {
    return this.logPath;
  }

  /**
   * Set the log directory
   *
   * @memberof Logger
   */
  public set path(value: string) {
    this.logPath = value;
  }

  /**
   * Will logs be written to file
   *
   * @memberof Logger
   */
  public get writeFile() {
    return this.doWrite;
  }

  /**
   * Set whether or not logs will be written to file
   *
   * @memberof Logger
   */
  public set writeFile(value: boolean) {
    this.doWrite = value;
  }

  /**
   * Get the current logging level
   *
   * @memberof Logger
   */
  public get level() {
    return this._level;
  }

  /**
   * Set a new logging level
   *
   * @memberof Logger
   */
  public set level(value: LEVEL) {
    this._level = value;
  }

  /**
   * Get the format string used for time
   *
   * @memberof Logger
   */
  public get timeFormat() {
    return this._timeFormat;
  }

  /**
   * Set the time format string
   * Any token supported by [luxon](https://moment.github.io/luxon/#/formatting?id=table-of-tokens) can be used
   *
   * @memberof Logger
   */
  public set timeFormat(value: string) {
    this._timeFormat = value;
  }

  /**
   * Get the log format
   *
   * @memberof Logger
   */
  public get logFormat() {
    return this._format;
  }

  /**
   * Set the log format
   * Current supported tokens are
   * - {time}
   * - {level}
   * - {content}
   * - {fileName}
   * - {lineNumber}
   * - {functionName}
   * - {columnNumber}
   *
   * @memberof Logger
   */
  public set logFormat(value: string) {
    this._format = value;
  }

  /**
   * Log a debug message
   *
   * @param {...any} args
   * @return {*}
   * @memberof Logger
   */
  public debug(...args: any) {
    this.log(LEVEL.debug, ...args);
  }

  /**
   * Log a info message
   *
   * @param {...any} args
   * @return {*}
   * @memberof Logger
   */
  public info(...args: any) {
    this.log(LEVEL.info, ...args);
  }

  /**
   * Log a success message
   *
   * @param {...any} args
   * @return {*}
   * @memberof Logger
   */
  public success(...args: any) {
    this.log(LEVEL.success, ...args);
  }

  /**
   * Log a warning warning
   *
   * @param {...any} args
   * @return {*}
   * @memberof Logger
   */
  public warning(...args: any) {
    this.log(LEVEL.warning, ...args);
  }

  /**
   * Log a error message
   *
   * @param {...any} args
   * @return {*}
   * @memberof Logger
   */
  public error(...args: any) {
    this.log(LEVEL.error, ...args);
  }

  /**
   * Log a notice message
   *
   * @param {...any} args
   * @return {*}
   * @memberof Logger
   */
  public notice(...args: any) {
    this.log(LEVEL.notice, ...args);
  }

  private log(level: LEVEL, ...args: any) {
    if (!this.checkLevel(level)) return;
    const parsed = [];
    for (const arg of args) {
      if (typeof arg === 'object') {
        parsed.push(inspect(arg));
      } else parsed.push(arg);
    }

    const line = parsed.join(' ');
    this.writeLine(level, line);

    let message = this._format
      .replace('{time}', this.getTime())
      .replace('{level}', LEVEL_COLOR[level])
      .replace('{content}', line);

    const trace = StackTrace.getSync();

    if (trace.length >= 3) {
      message = message
        .replace('{fileName}', trace[2].getFileName())
        .replace('{lineNumber}', trace[2].getLineNumber().toString())
        .replace('{functionName}', trace[2].getFunctionName())
        .replace('{columnNumber}', trace[2].getColumnNumber().toString());
    }

    switch (level) {
      case LEVEL.error:
        console.error(message);
        return;
      case LEVEL.warning:
        console.warn(message);
        return;
      default:
        console.log(message);
    }
  }

  private checkLevel(level: LEVEL) {
    return level >= this._level;
  }

  private getTime() {
    return DateTime.now().toFormat(this._timeFormat);
  }

  private writeLine(level: LEVEL, line: string) {
    if (!this.doWrite) return;
    if (!fs.existsSync(this.logPath)) fs.mkdirSync(this.logPath);
    const output = path.join(this.logPath, 'latest.log');
    let message = this._format
      .replace('{time}', this.getTime())
      .replace('{level}', LEVEL_TAG[level])
      .replace('{content}', line);

    const trace = StackTrace.getSync();

    if (trace.length >= 3) {
      message = message
        .replace('{fileName}', trace[2].getFileName())
        .replace('{lineNumber}', trace[2].getLineNumber().toString())
        .replace('{functionName}', trace[2].getFunctionName())
        .replace('{columnNumber}', trace[2].getColumnNumber().toString());
    }
    try {
      const stat = fs.statSync(output);
      if (Date.now() - stat.birthtimeMs >= 8.64e7) {
        const newName = `output-${new Date(stat.birthtimeMs).toLocaleDateString(
          'en-CA'
        )}.log`;
        fs.renameSync(output, path.join(this.logPath, newName));
      }
      fs.appendFileSync(output, `${message}\n`);
    } catch (error) {
      fs.writeFileSync(output, `${message}\n`);
    }
  }
}
