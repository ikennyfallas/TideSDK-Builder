/**
 * Store
 * =====
 * The store module holds all data incorporated by the application.
 * Data is saved in HTML5 localstorage.
 * @singleton
 */
define([], function () {

    //Private variables.
    var private = {};

    // The database object. It will be filled on initialization.
    var db = {
        apps:{},
        publishers:{}
    }


    //Loading indexed apps.
    private.app_keys = localStorage.getItem('builder.app_keys');
    if (private.app_keys !== null) {
        //Whoot, we have something!
        //Get all apps from the localStorage.
        private.app_keys = private.app_keys.split('|');
        _.each(private.app_keys, function (key) {
            db.apps[key] = JSON.parse(localStorage.getItem('builder.app.' + key));
        });
    }
    delete private.app_keys;


    //Loading stored publisher information.
    private.publisher_keys = localStorage.getItem('builder.publisher_keys');
    if (private.publisher_keys !== null) {
        //Loading publisher information.
        private.publisher_keys = private.publisher_keys.split('|');
        _.each(private.publisher_keys, function (key) {
            db.publishers[key] = JSON.parse(localStorage.getItem('builder.publisher.' + key));
        });
    }
    delete private.publisher_keys;


    var public = {
        // ===========================================================================================================
        // App functions
        // ===========================================================================================================

        /**
         * Returns the count of apps
         * @return int
         */
        app_count:function () {
            return Object.keys(db.apps).length;
        },

        /**
         * Checks if the specified app ID exists.
         * @param {String} id
         * @return {Boolean}
         */
        app_exists:function (id) {
            return typeof db.apps[id] != 'undefined';
        },

        /**
         * Will return a list of ids and titles of all existing apps.
         * @param {String} filter_value (optional) A string to search for in the application title. If not found, the app won't be returned.
         */
        app_list:function (filter_value) {
            if (typeof filter_value == 'undefined') filter_value = '';

            var result = [];

            for (var key in db.apps) {
                if (db.apps[key].title.indexOf(filter_value) != -1) result.push({id:key, title:db.apps[key].title});
            }

            return result;
        },

        /**
         * Retrieves all apps of the given publisher.
         * @param publisher_id
         */
        app_list_by_publisher:function (publisher_id) {
            return _.map(
                    _.find(db.apps, function (a) {
                        return a.publisher_id == publisher_id
                    }),
                    function (elm) {
                        return {id:elm.id, title:elm.title};
                    }
            );
        },

        /**
         * Reads application information from the database and returns a object, or null.
         * @param {String} id
         * @return {Object|Null}
         */
        app_get:function (id) {
            if (typeof db.apps[id] == 'undefined') return null;
            return db.apps[id];
        },

        /**
         * Will write application data to the database.
         * If the id isn't existent, it will be created.
         *
         * Will either trigger a "app:[ID]:update" event, or an "app:create" event.
         * @param {String} id
         * @param {Object} data
         */
        app_set:function (id, data) {
            var exists = (typeof db.apps[id] != 'undefined');

            db.apps[id] = data;

            //Update localStorage.
            localStorage.setItem('builder.app.' + id, JSON.stringify(data));
            if (!exists) localStorage.setItem('builder.app_keys', Object.keys(db.apps).join('|'));

            //Propagate that there is a new/changed dataset.
            if (exists) {
                public.trigger('app:' + id + ':update', data);
                public.trigger('app:update', {id:id, data:data});
            } else {
                public.trigger('app:create', {id:id, data:data});
            }
        },

        /**
         * This will remove a application from the database.
         * All information is LOST and can't be recovered!
         *
         * Will trigger a "app:[ID]:remove" event on success.
         * @param {String} id
         * @return {Boolean}
         */
        app_remove:function (id) {
            if (typeof db.apps[id] == 'undefined') return false;

            delete db.apps[id];

            //Update localStorage.
            localStorage.removeItem('builder.app.' + id);
            localStorage.setItem('builder.app_keys', Object.keys(db.apps).join('|'));

            public.trigger('app:' + id + ':remove');
            public.trigger('app:remove', {id:id, data:data});

            return true;
        },

        // ===========================================================================================================
        // Publisher functions
        // ===========================================================================================================

        /**
         * Returns the count of apps
         * @return int
         */
        publisher_count:function () {
            return Object.keys(db.publishers).length;
        },

        /**
         * Will return a list of ids and titles of all existing publishers.
         * @param {String} filter_value (optional) A string to search for in the publisher title. If not found, the publisher won't be returned.
         */
        publisher_list:function (filter_value) {
            if (typeof filter_value == 'undefined') filter_value = '';

            var result = [];

            for (var key in db.publishers) {
                if (db.publishers[key].title.indexOf(filter_value) != -1) result.push({id:key, title:db.publishers[key].title});
            }

            return result;
        },

        /**
         * Checks if the specified publisher ID exists.
         * @param {String} id
         * @return {Boolean}
         */
        publisher_exists:function (id) {
            return typeof db.publishers[id] != 'undefined';
        },

        /**
         * Reads publisher information from the database and returns a object, or null.
         * @param {String} id (optional) If the id is not set, the first publisher is returned.
         * @return {Object|Null}
         */
        publisher_get:function (id) {
            if (typeof id == 'undefined' || id == null) {
                if (!this.publisher_count()) return null;
                id = Object.keys(db.publishers)[0];
            }

            if (typeof db.publishers[id] == 'undefined') return null;
            return db.publishers[id];
        },

        /**
         * Will write publisher data to the database.
         * If the id isn't existent, it will be created.
         *
         * Will either trigger a "publisher:[ID]:update" event, or an "publisher:create" event.
         * @param {String} id
         * @param {Object} data
         */
        publisher_set:function (id, data) {
            var exists = (typeof db.publishers[id] != 'undefined');

            db.publishers[id] = data;

            //Update localStorage.
            localStorage.setItem('builder.publisher.' + id, JSON.stringify(data));
            if (!exists) localStorage.setItem('builder.publisher_keys', Object.keys(db.publishers).join('|'));

            //Propagate that there is a new/changed dataset.
            if (exists) {
                public.trigger('publisher:' + id + ':update', data);
                public.trigger('publisher:update', {id:id, data:data});
            } else {
                public.trigger('publisher:create', {id:id, data:data});
            }
        },

        /**
         * Will change the ID of a publisher.
         * The ID-connection to the according apps has to be updated, too.
         * @param {String} id
         * @param {String} new_id
         * @return {Boolean}
         */
        publisher_set_id: function(id, new_id){
            if(!this.publisher_exists(id) || this.publisher_exists(new_id)) return false;

            var dta = this.publisher_get(id),
                _this = this;

            _.each(db.apps, function(val, key){
                if(val.publisher_id == id){
                    db.apps[key].publisher_id = new_id;
                    localStorage.setItem('builder.app.' + key, JSON.stringify(db.apps[key]));
                }
            });

            delete db.publishers[id];
            localStorage.removeItem('builder.publisher.'+id);
            db.publishers[new_id] = dta;
            dta.id = new_id;
            localStorage.setItem('builder.publisher.' + new_id, JSON.stringify(dta));
            localStorage.setItem('builder.publisher_keys', Object.keys(db.publishers).join('|'));

            public.trigger('publisher:' + id + ':remove');
            public.trigger('publisher:create', {id:new_id, data:dta});

            return true;
        },

        /**
         * This will remove a publisherlication from the database.
         * All information is LOST and can't be recovered!
         *
         * Will trigger a "publisher:[ID]:remove" event on success.
         * @param {String} id
         * @return {Boolean}
         */
        publisher_remove:function (id) {
            if (typeof db.publishers[id] == 'undefined') return false;

            delete db.publishers[id];

            //Update localStorage.
            localStorage.removeItem('builder.publisher.' + id);
            localStorage.setItem('builder.publisher_keys', Object.keys(db.publishers).join('|'));

            public.trigger('publisher:' + id + ':remove');
            public.trigger('publisher:remove', {id:id, data:data});

            return true;
        },

        /**
         * Will remove ALL publisher information from the database.
         */
        publisher_flush:function () {
            _.each(db.publisher, function (p) {

            });
        }
    }

    _.extend(public, Backbone.Events);

    return public;
});