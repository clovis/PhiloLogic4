<%include file="header.mako"/>
<%include file="search_form.mako"/>
<div class="container-fluid" id='philologic_response'>
    <div id='object-title'>
        <span class='philologic_cite'>${f.biblio_citation(db,config, obj)}</span>
    </div>
    <div class="row hidden-sm" id="nav-buttons">
        <button type="button" class="btn btn-primary btn-sm" id="back-to-top">
            Back to top
        </button>
        <div class="col-sm-offset-4 col-sm-8">
            <div class="btn-group-sm">
                <button type="button" class="btn btn-primary" id="prev-obj" data-philo-id="${prev}">
                    &lt;
                </button>
                <button class="btn btn-primary" id="show-toc" style="width: 30%" disabled="disabled">Table of contents</button>
                <button type="button" class="btn btn-primary" id="next-obj" data-philo-id="${next}">
                    &gt;
                </button>
            </div>
        </div>
    </div>
    <div class="row" id="all-content">
        <div id="toc-wrapper" class="hidden-sm col-md-4" style="display: none;">
            <div class="panel panel-default" id="toc-container">
                <button type="button" class="btn btn-primary btn-xs pull-right" id="hide-toc">
                    <span class="glyphicon glyphicon-remove"></span>
                </button>
                <div id="toc-content"></div>
            </div>
        </div>
        <div class="col-xs-12 col-md-offset-2 col-md-8" id="center-content">
            <div class="row">
                <div class="col-xs-12">
                    <div id="book-page" class="panel panel-default">
                        <div id="prev_obj_text" data-philo-id="${prev}" style="display:none;"></div>
                        <div id="text-obj-content" data-philo-id="${' '.join([str(j) for j in obj.philo_id])}" data-prev="${prev}" data-next="${next}">${obj_text}</div>
                        <div id="next_obj_text" data-philo-id="${next}" style="display: none;"></div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>
<%include file="footer.mako"/>