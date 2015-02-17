"use strict"

philoApp.filter('unsafe', function($sce) { return $sce.trustAsHtml; });

philoApp.factory('radio', ['$rootScope', function($rootScope) {
    return {
        click: function(key, value) {
            $rootScope.formData[key] = value;
        },
        setReport: function(report) {
            for (var key in $rootScope.reportStatus) {
                if (key === report) {
                   $rootScope.reportStatus[key] = 'active';
                } else {
                    $rootScope.reportStatus[key] = '';
                }
            }
            this.click("report", report);
        }
    }
}]);

philoApp.factory('searchConfigBuild', ['$rootScope', function($rootScope) {
    return {
        timeSeriesIntervals: function() {
            var options = {1: "Year", 10: "Decade", 50: "Half Century", 100: "Century"};
            var intervals = [];
            for (var i=0; i < $rootScope.philoConfig.time_series_intervals.length; i++) {
                var interval = {
                    date: $rootScope.philoConfig.time_series_intervals[i],
                    alias: options[$rootScope.philoConfig.time_series_intervals[i]]
                };
                intervals.push(interval);
            }
            return intervals
        },
        metadata: function() {
            var metadataFields = {};
            for (var i=0; i < $rootScope.philoConfig.metadata.length; i++) {
                var metadata = $rootScope.philoConfig.metadata[i];
                metadataFields[metadata] = {}
                if (metadata in $rootScope.philoConfig.metadata_aliases) {
                    metadataFields[metadata].value = $rootScope.philoConfig.metadata_aliases[metadata];
                } else {
                    metadataFields[metadata].value = metadata;
                }
                metadataFields[metadata].example = $rootScope.philoConfig.search_examples[metadata];
            }
            return metadataFields
        }
    }
}]);

philoApp.factory('URL', function() {
    return {
        objectToString: function(formData, url) {
            var obj = angular.copy(formData);
            var str = [];
            for (var p in obj) {
                var k = p, 
                    v = obj[k];
                str.push(angular.isObject(v) ? this.objectToString(v, k) : (k) + "=" + encodeURIComponent(v));
            }
            return "dispatcher.py?" + str.join("&");
        },
        query: function(formData, url) {
            var obj = angular.copy(formData);
            var str = [];
            for (var p in obj) {
                var k = p, 
                    v = obj[k];
                str.push(angular.isObject(v) ? this.query(v, k) : (k) + "=" + encodeURIComponent(v));
            }
            if ("script" in obj) {
                return "scripts/" + obj.script + '?' + str.join("&");
            } else {
                return "reports/" + obj.report + '.py?' + str.join("&");
            }
        },
        path: function(pathInfo) {
            pathInfo = pathInfo.split(' ').join('/');
            return "dispatcher.py/" + pathInfo;
        }
    }
});

philoApp.factory('progressiveLoad', ['$rootScope', function($rootScope) {
    return {
        mergeResults: function(fullResults, newData, sortKey) {
            if (typeof fullResults === 'undefined') {
                fullResults = newData;
            } else {
                for (var key in newData) {
                    if (key in fullResults) {
                        fullResults[key].count += newData[key].count;
                    }
                    else {
                        fullResults[key] = newData[key];
                    }
                }
            }
            var sortedList = this.sortResults(fullResults, sortKey);
            return {"sorted": sortedList, "unsorted": fullResults};
        },
        sortResults: function(fullResults, sortKey) {
            var sortedList = [];
            for (var key in fullResults) {
                sortedList.push({label:key, count: parseInt(fullResults[key].count), url: fullResults[key].url});
            }
            if (sortKey === "label") {
                sortedList.sort(function(a,b) {return a.label - b.label});
            } else {
                sortedList.sort(function(a,b) {return b.count - a.count});
            }
            return sortedList;
        },
        saveToLocalStorage: function(results) {
            if (typeof(localStorage) == 'undefined' ) {
                alert('Your browser does not support HTML5 localStorage. Try upgrading.');
            } else {
                try {
                    sessionStorage[$location.url()] = JSON.stringify(results);
                } catch(e) {
                    sessionStorage.clear();
                    console.log("Clearing sessionStorage for space...");
                    try {
                        sessionStorage[$location.url()] = JSON.stringify(results);
                    } catch(e) {
                        sessionStorage.clear();
                        console.log("Quota exceeded error: the JSON object is too big...")
                    }
                }
            }
        }
    }
}]);

philoApp.factory('collocation', ['$rootScope', '$http', 'URL', 'defaultDiacriticsRemovalMap', 'progressiveLoad',  function($rootScope, $http, URL, defaultDiacriticsRemovalMap, progressiveLoad) {
    return {
        activateLinks: function() {
            // Activate links on collocations
            $('span[id^=all_word], span[id^=left_word], span[id^=right_word]').addClass('colloc_link');
            var href = window.location.href;
            $('.colloc_link, .cloud_term').click(function(e) {
                e.preventDefault();
                window.location = $(this).data('href');
            });
        },
        updateCollocation: function($scope, fullResults, resultsLength, start, end) {
            $rootScope.formData.start = start;
            $rootScope.formData.end = end;
            var request = $scope.philoConfig.db_url + '/' + URL.query($rootScope.formData);
            var collocation = this;
            $http.get(request)
            .success(function(data, status, headers, config) {
                if (!resultsLength) {
                    // Fetch total results now since we know the hitlist will be fully on disk
                    var queryParams = angular.copy($rootScope.formData)
                    queryParams.script = "get_total_results.py";
                    queryParams.report = "concordance"
                    $http.get($scope.philoConfig.db_url + '/' + URL.query(queryParams))
                    .success(function(length, status, headers, config) {
                        $scope.resultsLength = length;
                        collocation.sortAndRenderCollocation($scope, fullResults, data, length, start, end)
                    })
                } else {
                    collocation.sortAndRenderCollocation($scope, fullResults, data, resultsLength, start, end)
                }
            })
            .error(function(data, status, headers, config) {
                console.log("Error", status, headers)
            });
        },
        sortAndRenderCollocation: function($scope, fullResults, data, resultsLength, start, end) {
            if (end <= resultsLength) {
                $scope.percent = Math.floor(end / resultsLength * 100);
            }
            if (typeof(fullResults) === "undefined") {
                fullResults = {"all_collocates": {}, 'left_collocates': {}, 'right_collocates': {}}
            }
            var all = progressiveLoad.mergeResults(fullResults["all_collocates"], data["all_collocates"]);
            var left = progressiveLoad.mergeResults(fullResults["left_collocates"], data['left_collocates']);
            var right = progressiveLoad.mergeResults(fullResults["right_collocates"], data['right_collocates']);
            $scope.sortedLists = {
                'all': all.sorted.slice(0, 100),
                'left': left.sorted.slice(0, 100),
                'right': right.sorted.slice(0, 100)
                };
            //this.collocationCloud($scope.sortedLists.all);
            if (typeof(start) === "undefined" || end < resultsLength) {
                var tempFullResults = {"all_collocates": all.unsorted, "left_collocates": left.unsorted, "right_collocates": right.unsorted};
                if (start === 0) {
                    start = 1000;
                } else {
                    start += 5000;
                }
                end += 5000;
                this.updateCollocation($scope, tempFullResults, resultsLength, start, end);
            } else {
                $scope.percent = 100;
                $scope.filterList = data.filter_list;
                $scope.done = true;
                this.activateLinks();
                progressiveLoad.saveToLocalStorage({results: $scope.sortedLists, resultsLength: $scope.resultsLength, filterList: $scope.filterList});
            }
        }
    }
}]);