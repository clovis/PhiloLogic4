#!/usr/bin/env python

import os
import sys
sys.path.append('..')
from functions.wsgi_handler import parse_cgi
from wsgiref.handlers import CGIHandler
from philologic.HitWrapper import ObjectWrapper
from mako.template import Template
import reports as r
import functions as f
import json

obj_level = {'doc': 1, 'div1': 2, 'div2': 3, 'div3': 4}

def get_table_of_contents(environ, start_response):
    status = '200 OK'
    headers = [('Content-type', 'text/html; charset=UTF-8'),("Access-Control-Allow-Origin","*")]
    start_response(status,headers)
    environ["SCRIPT_FILENAME"] = environ["SCRIPT_FILENAME"].replace('scripts/get_table_of_contents.py', '')
    db, path_components, q = parse_cgi(environ)
    config = f.WebConfig()
    path = db.locals['db_path']
    path = path[:path.rfind("/data")]
    obj = ObjectWrapper(q['philo_id'].split(), db)
    results = r.navigate_doc(obj, db)
    if q['format'] == "json":
        html = ''
        for philo_id, philo_type, head in results:
            link_id = philo_id.replace(' ', '_')
            href = f.link.make_absolute_object_link(config, philo_id.split()[:7])
            html += "<span>"
            style = ""
            if philo_type == "div2":
                space = '&nbsp&nbsp&nbsp'
            elif philo_type == "div3":
                space = '&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp'
            else:
                space = ''
            html += space + '<a href="%s" id="%s" style="text-decoration: none;">%s</a></span><br>' % (href, link_id, head or philo_type.upper())
        yield json.dumps(html)
    else:
        div1_markup = '<span class="ui-icon ui-icon-bullet" style="float:left;position:relative;top: 3px;"></span>'
        div2_markup = '<span class="ui-icon ui-icon-radio-on" style="float:left;position:relative;top:3px;margin-left: 1em;"></span>'
        div3_markup = '<span class="ui-icon ui-icon-radio-off" style="float:left;top:3px;position:relative;margin-left: 2em;"></span>'
        html = ['<div id="table_of_contents" class="table_of_contents">']
        for philo_id, philo_type, head in results:
            link_id = philo_id.replace(' ', '_')
            href = f.link.make_absolute_object_link(config, philo_id.split()[:7])
            html.append('<span class="toc_link">')
            if philo_type == "div2":
                space = div2_markup
            elif philo_type == "div3":
                space = div3_markup
            else:
                space = div1_markup
            html.append(space + '<a href="%s" id="%s">%s</a></span>' % (href, link_id, head or philo_type.upper()))
        html.append("</div>")
        html = ''.join(html)
        yield html.encode('utf-8', 'ignore')
    
if __name__ == "__main__":
    CGIHandler().run(get_table_of_contents)