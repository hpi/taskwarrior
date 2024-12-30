#!/usr/bin/env python3

from pathlib import PurePath, Path
from typing import List, Dict, Union, Iterator, NamedTuple, Any, Sequence, Optional, Set
import json
from pathlib import Path
from datetime import datetime
import logging

import pytz

from .exporthelpers.dal_helper import PathIsh, Json, Res

def get_logger():
    return logging_helper.logger('taskwarrior')

class DAL:
    def __init__(self, sources: Sequence[PathIsh]) -> None:
        self.sources = [p if isinstance(p, Path) else Path(p) for p in sources]


    def raw(self):
        for f in sorted(self.sources):
            print(self.sources)
            with f.open(encoding="utf-8") as fo:
                yield json.load(fo)

    def projects(self) -> Iterator[Res[Json]]:
      for r in self.raw():
        for p in r['projects']:
          yield p

    def tasks(self) -> Iterator[Res[Json]]:
      for r in self.raw():
        for t in r['tasks']:
          yield t

if __name__ == '__main__':
    dal_helper.main(DAL=DAL)
