#!/usr/bin/env python

import os
import sys
sys.path.append('..')
import functions as f
import reports as r
import json
from philologic.HitList import NoHits
from functions.wsgi_handler import wsgi_response, parse_cgi


def error(environ,start_response):
    try:
        db, dbname, path_components, q = wsgi_response(environ,start_response)
    except AssertionError:
        myname = environ["SCRIPT_FILENAME"]
        dbname = os.path.basename(myname.replace("/dispatcher.py",""))
        db, path_components, q = parse_cgi(environ)
    return error_handling(db, dbname, q)
    
def error_handling(db, dbname, q):
    hits = NoHits()
    path = os.getcwd().replace('functions/', '')
    config = f.WebConfig()
    report = q['report']
    hits = NoHits()
    if report == "concordance" or report == "bibligraphy":
        concordance_object = {"description": {"start": 0, "end": 0, "results_per_page": q['results_per_page']},
                              "query": q,
                              "results": [],
                              "results_len": 0,
                              "query_done": True
                              }
        return r.render_concordance(concordance_object, hits, q, db, dbname, path, config)
    elif report == "kwic":
        kwic_object = {"description": {"start": 0, "end": 0, "results_per_page": q['results_per_page']},
                       "query": q,
                       "results": [],
                       "results_len": 0,
                       "query_done": True
                       }
        return r.render_kwic(kwic_object, hits, q, db, dbname, path, config)
    elif report == "collocation":
        return r.render_collocation(hits, db, dbname, q, path, config)
    elif report == "time_series":
        q = r.handle_dates(q, db)
        return r.render_time_series(hits, db, dbname, q, path, config)