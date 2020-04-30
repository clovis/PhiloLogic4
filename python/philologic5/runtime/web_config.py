#!/usr/bin/env python3


import sys

from philologic5.Config import MakeWebConfig


class brokenConfig(object):
    def __init__(self, db_path, traceback):
        self.production = True
        self.db_path = db_path
        self.theme = "default_theme.css"
        self.time_series_year_field = ""
        self.valid_config = False
        self.traceback = traceback
        self.global_config_location = "/etc/philologic/philologic4.cfg"


def WebConfig(db_path):
    try:
        return MakeWebConfig(db_path + "/data/web_config.cfg")
    except Exception as traceback:
        print(traceback, file=sys.stderr)
        return brokenConfig(db_path, str(traceback))