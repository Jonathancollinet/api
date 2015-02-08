module.exports = function(grunt) {
    grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),
        concurrent: {
            dev: [
                'nodemon',
                'watch'
            ],
            options: {
                logConcurrentOutput: true
            }
        },
		js: {
		    files: ['public/js/**/*.js'],
		    min: ['public/min/**/*.js']
		},
		less: {
		    files: ['public/less/**/*.less'],
		    min: ['public/css/**/*.css']
		},
		nodemon: {
			dev: {
				script: 'app.js'
			}
		},
		watch: {
			styles: {
				files: ['public/less/**/*.less'], // which files to watch
				tasks: ['less'],
				// options: {
				// 	nospawn: true
				// }
			},
			js: {
			    files: ['<%= js.files %>'],
			    tasks: ['uglify:views']
			}
		},
		uglify: {
			views: {
				files: [{
					expand: true,
					cwd: 'public/js/',
					src: ['**/*.js', '!**/*.min.js'],
					dest: 'public/min/',
					ext: '.min.js'
				}]
			}
		},
		less: {
			development: {
				options: {
					paths: ["assets/css"]
				},
				files: {
				}
			}
		},
		clean: {
			js: {
				src: [
					'public/min/**/*.min.js'
				]
			},
			css: {
				src: [
					'public/css/**/*.css'
				]
			}
		}
    });

	grunt.loadNpmTasks('grunt-contrib-watch');
	grunt.loadNpmTasks('grunt-contrib-uglify');
	grunt.loadNpmTasks('grunt-contrib-clean');
	grunt.loadNpmTasks('grunt-nodemon');
	grunt.loadNpmTasks('grunt-concurrent');
	grunt.loadNpmTasks('grunt-contrib-less');

	grunt.registerTask('default', ["uglify", "less", "concurrent"]);
	grunt.registerTask('cleaner', ['clean']);
};
