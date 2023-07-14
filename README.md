# Logger

A simple logger for your projects

```js
const { Logger, LEVEL } = require('@elenoragroup/logger');

const logger = Logger.createInstance();

logger.level = LEVEL.debug;

logger.debug('Hello yes this is a debug message');
logger.info('Hello yes this is a info message with', 3, 'args');
logger.success('Spoopy it was a success');
logger.warning('Knock it off dude');
logger.error('Errors everywhere');
logger.notice('Notice me uwu');
```

![What it looks like](https://elenora.gg/logger.png)
