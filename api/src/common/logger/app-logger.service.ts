import { Injectable, Scope, Inject } from '@nestjs/common';
import { Logger } from '@nestjs/common';
import { INQUIRER } from '@nestjs/core';

@Injectable({ scope: Scope.TRANSIENT })
export class AppLogger extends Logger {
  constructor(@Inject(INQUIRER) parentClass: object) {
    super(parentClass?.constructor?.name || 'Application');
  }
}
