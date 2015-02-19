'use strict'
module.exports = function (grunt) {
  grunt.initConfig({
    watch: {
      options: {
        livereload: true
      },
      html: {
        files: ['**/*.html'],
        tasks: ['']
      },
      js: {
        files: ['**/*.js'],
        tasks: ['']
      }
    },

    connect: {
      server: {
        options: {
          port: 9000
        }
      }
    }
  });

  grunt.loadNpmTasks("grunt-contrib-watch")
  grunt.loadNpmTasks("grunt-contrib-connect")
  grunt.registerTask("default", ["connect", "watch"])
};
