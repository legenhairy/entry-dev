var fetch = require('node-fetch');
var redis = require('redis'),
	client = redis.createClient();

//for wrapping redis set in promises
const { promisify } = require("util");
const setAsync = promisify(client.set).bind(client);

//grab jobs from area i would prefer to work from
const baseURL = 'https://jobs.github.com/positions.json';

async function fetchGithub() {
	
	let resultCount = 1, onPage = 0;
	const allJobs = [];

	//fetch all jobs from california
	while(resultCount > 0) {
		const res = await fetch(`${baseURL}?page=${onPage}&location=ca`);
		const jobs = await res.json();
		allJobs.push(...jobs);	
		resultCount = jobs.length; //if jobs on a certain page is 0, we should stop calls
		console.log('got', jobs.length, 'jobs');
		onPage++;
	}

	console.log('got', allJobs.length, 'jobs total');


	// filter algorithm
	const jrJobs = allJobs.filter(job => {
		const jobTitle = job.title.toLowerCase();
		let isJunior = true;

		//algo logic
		if(jobTitle.includes('senior') ||
			jobTitle.includes('manager') ||
			jobTitle.includes('sr.') ||
			jobTitle.includes('architect') ||
			jobTitle.includes('lead')
		) {
			return false;
		}

		return true;
	})

	console.log('filtered down to', jrJobs.length);

	//set in redis
	const success = await setAsync('github', JSON.stringify(jrJobs));

	console.log({success});
}

module.exports = fetchGithub;