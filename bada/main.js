const repoOwner = "ANA-CNU";
const repoName = "ANA-Daily-Algorithm";
const baseApiUrl = "https://api.github.com";
const perPage = 100; // Maximum per_page value
let page = 1;

const getMonthlyCommitCount = async () => {
  const commitCountByCollaborator = {};

  // Determine the current year and month in UTC+9 (Japan Standard Time)
  const currentDateInJST = new Date(
    new Date().toLocaleString("en-US", { timeZone: "Asia/Tokyo" })
  );
  const currentYear = currentDateInJST.getFullYear();
  const currentMonth = currentDateInJST.getMonth() + 1; // Months are 0-indexed
  const maximumRequest = 20;
  let requestCount = 0;

  while (requestCount < maximumRequest) {
    // Build the URL to list commits for the current month on the current page
    const commitsUrl = `${baseApiUrl}/repos/${repoOwner}/${repoName}/commits?since=${currentYear}-${currentMonth
      .toString()
      .padStart(2, "0")}-01T00:00:00Z&page=${page}&per_page=${perPage}`;

    // Fetch commits for the current page
    const response = await fetch(commitsUrl);
    requestCount++;

    if (!response.ok) {
      throw new Error("Failed to fetch commits");
    }

    const rateLimitRemaining = response.headers.get("X-Ratelimit-Remaining");

    document.getElementById("remainingRefreshCount").textContent =
      rateLimitRemaining;

    const commits = await response.json();

    // Count commits by collaborator
    commits.forEach((commit) => {
      const collaborator = commit.commit.author.name;

      if (commitCountByCollaborator[collaborator]) {
        commitCountByCollaborator[collaborator]++;
      } else {
        commitCountByCollaborator[collaborator] = 1;
      }
    });

    // If there are fewer commits than perPage, it means we've reached the last page
    if (commits.length < perPage) {
      break;
    }

    // Increment the page number for the next request
    page++;
  }

  // Sort the collaborators by commit count
  const sortedCollaborators = Object.entries(commitCountByCollaborator).sort(
    (a, b) => b[1] - a[1]
  );

  // Display the results
  const commitCountsElement = document.getElementById("commitCounts");
  sortedCollaborators.forEach(([collaborator, commitCount]) => {
    commitCountsElement.innerHTML += `<li>${collaborator}: ${commitCount} 문제</li>`;
  });

  return commitCountByCollaborator;
};

const getWeightedShuffle = (collaborators, seed) => {
  const weightedCollaborators = [];

  for (const [collaborator, commitCount] of Object.entries(collaborators)) {
    for (let i = 0; i < commitCount; i++) {
      weightedCollaborators.push(collaborator);
    }
  }

  const shuffledCollaborators = shuffleWithSeed(weightedCollaborators, seed);

  const uniqueArray = [...new Set(shuffledCollaborators)];

  // Display the results
  const commitCountsElement = document.getElementById("commitCountsShuffled");
  uniqueArray.forEach((collaborator) => {
    commitCountsElement.innerHTML += `<li>${collaborator}: ${collaborators[collaborator]} 문제</li>`;
  });

  return uniqueArray;
};

getMonthlyCommitCount().then((collaborators) => {
  const seed = "ANA-CNU";
  getWeightedShuffle(collaborators, seed);
});
