function drawFlow(flowData, svgName) {

    var margin = {top: 100, right: 10, bottom: 0, left: 10},
        col_number, row_number,
        forum,
        oneDay = 3600 * 24,
        rowThread = [],
        colDate = [];

    var minDate = Infinity,
        maxDate = -Infinity,
        everyDate = minDate;


    var curWidth = d3.select("#interactionOuter").style('width');
    var width = parseInt(curWidth.substr(0, curWidth.length - 2)) - margin.left - margin.right - 150;
    var height = 200;

    var maxlength, totalHeight;
    var forumContentSvg = d3.select(svgName).append("svg").attr("class", "forumSvg");
    var labelSvg = d3.select("#chartLabel").append("svg").attr("class", "labelSvg");

    var forumDayInfo;
    var forumAllArr = [];


    var important_date = [{
        "title": "lanuchMessage",
        "date": 1340409600
    }, {
        "title": "courseStart",
        "date": 1374451200
    }, {
        "title": "assign1",
        "date": 1374969600
    }, {
        "title": "assign2",
        "date": 1375574400
    }, {
        "title": "assign3",
        "date": 1376179200
    }, {
        "title": "assign4",
        "date": 1376784000
    }, {
        "title": "final",
        "date": 1377388800
    }];
    //colorsForum = ['#FFFFFF','#F1EEF6','#E6D3E1','#DBB9CD','#D19EB9','#C684A4','#BB6990','#B14F7C','#A63467','#9B1A53','#91003F'];
    lightForum = ['#fffee5', '#fffdcf', '#fffbb8', '#fffaa1', '#fff98a', '#fff873', '#fff75c', '#fff645', '#fff82e', '#fff317', '#fff200'];
    colorsForum = ['#4575b4', '#91bfdb', '#e0f3f8', '#fffebf', '#fee090', '#fc8d59', '#d73027'];


    flowData = preprocess (flowData);

    flowData.forEach(function(subforum) {
        forum = computeForumDay(subforum);
        forumAllArr.push(forum);
        forumAllArr.sort(sortById);
    });
    drawLabels(everyDate, minDate, maxDate);
    drawForumContent(forumAllArr);


    function drawLabels(everyDate, minDate, maxDate) {
        colDate = [];
        while (everyDate <= maxDate) {
            colDate.push(everyDate);
            everyDate += oneDay;
        }
        col_number = colDate.length;
        row_number = 10;
        cellSize = width / colDate.length;

        labelSvg.selectAll("g").remove();

        var curSVG = labelSvg
            .append("g")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
            .attr("width", 2 * width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom);




    }


    function computeForumDay(subforum) {
        var forumDayArr = [],
            flagThread, flagDay;
        subforum.contributions.forEach(function(forumData) {
            forumData.formatDate = processDate(forumData.date);

            if (true) {
                flagDay = false;
                forumDayArr.forEach(function(forumDay) { // constructed according to date info
                    flagThread = false;
                    if (forumDay.date == forumData.date) {
                        flagDay = true;
                        var countryShow = true;
                        forumDay.threads.forEach(function(forumThread) {
                            var ave, total = 0, count = 0;
                            if (forumThread.threadId == forumData.threadId && countryShow) {
                                forumThread.contributions.push(forumData);
                                if (forumData.type == "thread") {
                                    forumThread.date = forumData.date;
                                    forumThread.formatDate = forumData.formatDate;
                                    forumThread.title = forumData.title;
                                }
                                flagThread = true;
                            }
                        });
                        if (!flagThread && countryShow) {
                            var newForumThread = {
                                threadId: forumData.threadId,
                                contributions: [],
                                formatDate: 0,
                                date: 0,
                                title: ""
                            }
                            if (forumData.type == "thread") {
                                newForumThread.date = forumData.date;
                                newForumThread.formatDate = forumData.formatDate;
                                newForumThread.title = forumData.title;
                            }
                            newForumThread.contributions.push(forumData);
                            forumDay.threads.push(newForumThread);
                        }
                    }
                });
                if (!flagDay) {
                    var newForumDay = {
                        date: forumData.date,
                        formatDate: forumData.formatDate,
                        threads: []
                    }
                    var newForumThread = {
                        threadId: forumData.threadId,
                        contributions: [],
                        date: 0,
                        formatDate: 0,
                        title: ""
                    }
                    if (forumData.type == "thread") {
                        newForumThread.date = forumData.date;
                        newForumThread.formatDate = forumData.formatDate;
                        newForumThread.title = forumData.title;
                    }
                    newForumThread.contributions.push(forumData);
                    newForumDay.threads.push(newForumThread);
                    forumDayArr.push(newForumDay);
                }
            }
        });
        subforum.contributions.forEach(function(forumData) {
            forumDayArr.forEach(function(forumDay) {
                if (forumDay.date > forumData.date) {
                    forumDay.threads.forEach(function(forumThread) {
                        forumThread.contributions.sort(sortByTime);
                        if (forumThread.threadId == forumData.threadId) {
                            forumThread.contributions.push(forumData);
                            if (forumData.type == "thread") {
                                forumThread.date = forumData.date;
                                forumThread.formatDate = forumData.formatDate;
                                forumThread.title = forumData.title;
                            }
                        }
                    });
                }
            });
        });

        forumDayArr.sort(sortByTime);
        forumDayArr.maxlength = 0;
        forumDayArr.forEach(function(forumDay) {
            // forumDay.threads.sort(sortByThreadId);
            forumDay.threads.forEach(function(forumDayThread) {
                var total = 0;
                var curN = 0;
                var curTotal = 0;
                forumDayThread.contributions.sort(sortByTime);
                forumDayThread.contributions.forEach(function(contribution) {
                    total += contribution.sentiment;
                    if (contribution.date == forumDay.date) {
                        curTotal += contribution.sentiment;
                        curN = curN + 1;
                    }
                });
                forumDayThread.sentiment = total / forumDayThread.contributions.length;
                forumDayThread.curSentiment = curTotal / curN;
                forumDayThread.curN = curN;
            })

            forumDay.threads.sort(sortBySentiment);

            if (forumDay.threads.length > forumDayArr.maxlength)
                forumDayArr.maxlength = forumDay.threads.length;
        });
        forumDayInfo = {
            "forumDay": forumDayArr,
            "maxlength": forumDayArr.maxlength,
            "forumId": subforum.forumId,
            "forumName": subforum.forumName
        };
        if (forumDayArr.maxlength > 0) {
            if (minDate > forumDayArr[0].date) minDate = forumDayArr[0].date;
            everyDate = minDate;
            if (maxDate < forumDayArr[forumDayArr.length - 1].date)
                maxDate = forumDayArr[forumDayArr.length - 1].date;
        }

        return forumDayInfo;
    }

    function drawForumContent(forums) {
        forums.forEach(function(forum) {
            var stack = {};
            for (var date = minDate; date <= maxDate; date += 3600 * 24) {
                stack[date * 1000] = 0;
            }
            forum.forumDay.forEach(function(day) {
                stack[day.date * 1000] = day.threads.length;
            })
            var stackArray = [];

            for (date = minDate; date <= maxDate; date += 3600 * 24) {
                stackArray.push({
                    "date": date * 1000,
                    "value": stack[date * 1000]
                });
            }

            forum.values = stackArray;
        });

        margin = {
            top: 10,
            right: 0,
            bottom: 10,
            left: 20
        },
            rowThread = [];

        forumContentSvg.selectAll("g").remove();
        d3.select(svgName).selectAll("div").remove();


        var svg = forumContentSvg
            .attr("width", 2 * width + margin.left + margin.right)
            .attr("height", 2 * height)

            .append("g")
            .attr("transform", "translate(" + 2*margin.left + "," + margin.top + ")");


        var colLabels = svg.append("g")
            .selectAll(".colLabelg")
            .data(colDate)
            .enter()
            .append("text")
            .text(function(d) {
                return processDate(d);
            })
            .attr("x", 0)
            .attr("y", function(d) {
                return (colDate.indexOf(d) + 1) * cellSize;
            })
            .style("text-anchor", "left")
            .style("opacity", ".4")
            .attr("class", "forumContentChart flowG")
            .attr("transform", "translate(" + cellSize / 2 + ",94) rotate (-90)")
            .attr("class", function(d, i) {
                return "colLabel mono c" + i;
            });
        var colLabels = svg.append("g")
            .selectAll(".colLabelg")
            .data(important_date)
            .enter()
            .append("text")
            .text(function(d) {
                return d.title;
            })
            .attr("x", 0)
            .attr("y", function(d) {
                return (colDate.indexOf(d.date) + 1) * cellSize;
            })
            .style("text-anchor", "left")
            .attr("transform", "translate(" + cellSize / 2 + ",94) rotate (-90)")
            .attr("class", "forumContentChart flowG")
            .attr("class", function(d, i) {
                return "colLabel mono c" + i;
            })
            .on("mouseover", function(d) {
                d3.select(this).classed("text-hover", true);
            })
            .on("mouseout", function(d) {
                d3.select(this).classed("text-hover", false);
            });


        var format = d3.time.format("%m/%d/%y");

        var tooltip = d3.select("#contentView")
            .append("div")
            .attr("class", "remove")
            .style("position", "absolute")
            .style("z-index", "20")
            .style("visibility", "hidden");

        var stack = d3.layout.stack()
            .offset("silhouette")
            // .order("zero")
            .values(function(d) {return d.values;})
            .x(function(d) {return d.date;})
            .y(function(d) {return d.value;});

        var layers = stack(forums, 4);


        var area = d3.svg.area()
            .interpolate("cardinal")
            .x(function(d) {return x(d.date);})
            .y0(function(d) {return y(d.y0);})
            .y1(function(d) {return y(d.y0 + d.y);});

        var colorrange = ["#045A8D", "#2B8CBE", "#74A9CF", "#A6BDDB", "#D0D1E6", "#F1EEF6"];;

        var datearray = [];

        var x = d3.time.scale().range([0, width]);
        var y = d3.scale.linear().range([height, 0]);
        var yAxis = d3.svg.axis().scale(y);
        var yAxisr = d3.svg.axis().scale(y);
        var z = d3.scale.ordinal().range(colorrange);

        x.domain(d3.extent(layers[0].values, function(d) {return d.date;}));

        y.domain([0, d3.max(layers, function(d) {
            return d3.max(d.values, function(dd) {
                return dd.y0 + dd.y;
            })
        })]);

        svg.selectAll(".layer")
            .data(layers)
            .enter().append("path")
            .attr("class", "layer flowG")
            .attr("transform", "translate(" + 0 + ", 120)")
            .attr("d", function(d) { return area(d.values);})
            .style("fill", function(d, i) {return z(i);});

        svg.append("g")
            .attr("class", "y axis flowG")
            .attr("transform", "translate(" + width + ", 120)")
            .call(yAxis.orient("right"));

        svg.append("g")
            .attr("class", "y axis flowG")
            .attr("transform", "translate(" + 3 + ", 120)")
            .call(yAxis.orient("left"));


        svg.selectAll(".layer")
            .attr("opacity", 1)
            .on("mouseover", function(d, i) {
                svg.selectAll(".layer").transition()
                    .duration(250)
                    .attr("opacity", function(d, j) {return j != i ? 0.6 : 1;})
            })
            .on("mousemove", function(d, i) {
                var mousep = d3.mouse(this),
                mousex = mousep[0],
                mousey = mousep[1];
                var invertedx = x.invert(mousex);
                invertedx = invertedx.getMonth() + invertedx.getDate();
                var selected = (d.values);
                for (var k = 0; k < selected.length; k++) {
                    datearray[k] = new Date(selected[k].date)
                    datearray[k] = datearray[k].getMonth() + datearray[k].getDate();
                }

                mousedate = datearray.indexOf(invertedx);
                pro = d.values[mousedate].value;

                d3.select(this)
                    .classed("hover", true)
                    .attr("stroke", "orange")
                    .attr("stroke-width", "1px");
                tooltip.html("<div class='tooltips'><p>Forum: " + d.forumName + "<br>Count:" + pro + "</p></div>").style("visibility", "visible")
                    .style("top", (mousey + margin.top + 50) + "px")
                    .style("left", (mousex + margin.left + 30) + "px");

            })
            .on("mouseout", function(d, i) {
                svg.selectAll(".layer")
                    .transition()
                    .duration(250)
                    .attr("opacity", "1");
                d3.select(this)
                    .classed("hover", false)
                    .attr("stroke-width", "0px"), tooltip.html("<div class='tooltips'><p>" + d.key + "<br>" + pro + "</p></div>").style("visibility", "hidden");
            })

        var vertical = d3.select(svgName)
            .append("div")

        d3.select(svgName)
            .on("mousemove", function() {
                mousex = d3.mouse(this);
                mousex = mousex[0] + 5;
                vertical.style("left", mousex + "px")
            })
            .on("mouseover", function() {
                mousex = d3.mouse(this);
                mousex = mousex[0] + 5;
                vertical.style("left", mousex + "px")
            });

    }


    function preprocess (forumData){
            var subforumArr = [],
                content;

        forumData.forEach(function (d) {
                content = {
                    contributionId: d.contributionId,
                    userId: d.userId,
                    courseId: d.courseId,
                    forumId: d.forumId,
                    threadId: d.threadId,
                    date: d.date,
                    time: d.time,
                    votes: d.votes,
                    grade: d.grade,
                    forumName: d.forumName,
                    sentiment: d.sentiment
                };
                var flag = false;
                subforumArr.forEach(function (subforum) {
                    if (subforum.forumId == content.forumId) {
                        subforum.contributions.push(content);
                        flag = true;
                    }
                });
                if (!flag) {
                    var newSubForum = {
                        forumId: content.forumId,
                        forumName: content.forumName,
                        contributions: []
                    };
                    newSubForum.contributions.push(content);
                    subforumArr.push(newSubForum);
                }
            });
        return subforumArr;
    }


    function sortById(a,b){
        return d3.ascending(a.forumId, b.forumId);
    }

    function sortByTime(a,b){
        return d3.ascending(a.date, b.date) ||
            d3.ascending(a.contributionId, b.contributionId) ||
            (a.contributionId == b.contributionId && d3.ascending(a.time, b.time));
    }
    function sortBySentiment(a,b){
        return d3.ascending(a.curSentiment, b.curSentiment);
    }
    function processDate(date){
        var newDate = new Date(date * 1000);
        var year = newDate.getFullYear() + 4;
        var month = newDate.getMonth() + 3;
        var date = newDate.getDate();
        var text = year + " / " + month + " / " + date;
        return text;
    }
}
