const getMonthlyCommits = async () => {
  const repoOwner = "ANA-CNU";
  const repoName = "ANA-Daily-Algorithm";
  const baseApiUrl = "https://api.github.com";
  const perPage = 100; // Maximum per_page value
  let page = 1;

  // Determine the current year and month in UTC+9 (Japan Standard Time)
  const currentDateInJST = new Date(
    new Date().toLocaleString("en-US", { timeZone: "Asia/Tokyo" })
  );
  const currentYear = currentDateInJST.getFullYear();
  const currentMonth = currentDateInJST.getMonth() + 1; // Months are 0-indexed
  const maximumRequest = 20;
  let requestCount = 0;

  const monthlyCommits = [];

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
    monthlyCommits.push(...commits);

    // If there are fewer commits than perPage, it means we've reached the last page
    if (commits.length < perPage) {
      break;
    }
    // Increment the page number for the next request
    page++;
  }

  return monthlyCommits;
};

const getSolveCountByUser = (monthlyCommits) => {
  const solveCountByUser = {};

  monthlyCommits.forEach((commit) => {
    const userName = commit.commit.author.name;

    if (solveCountByUser[userName]) {
      solveCountByUser[userName]++;
    } else {
      solveCountByUser[userName] = 1;
    }
  });

  return solveCountByUser;
};

const displaySolveCountRank = (solveCountByUser) => {
  const sortedUser = Object.entries(solveCountByUser).sort(
    (a, b) => b[1] - a[1]
  );

  const commitCountsElement = document.getElementById("commitCounts");
  sortedUser.forEach(([userName, commitCount]) => {
    commitCountsElement.innerHTML += `<li>${userName}: ${commitCount} 문제</li>`;
  });
};

const getPrizeRank = (solveCountByUser, seed = "ANA") => {
  const weightedUserNames = [];

  for (const [userName, commitCount] of Object.entries(solveCountByUser)) {
    for (let i = 0; i < commitCount; i++) {
      weightedUserNames.push(userName);
    }
  }

  const shuffledUserNames = shuffleWithSeed(weightedUserNames, seed);
  const prizeRank = [...new Set(shuffledUserNames)];

  return prizeRank;
};

const displayPrizeRank = (uniqueUserNames, solveCountByUser) => {
  const commitCountsElement = document.getElementById("commitCountsShuffled");
  uniqueUserNames.forEach((userName) => {
    commitCountsElement.innerHTML += `<li>${userName}: ${solveCountByUser[userName]} 문제</li>`;
  });
};

getMonthlyCommits().then((monthlyCommits) => {
  const solveCountByUser = getSolveCountByUser(monthlyCommits);
  displaySolveCountRank(solveCountByUser);

  const prizeRank = getPrizeRank(solveCountByUser);
  displayPrizeRank(prizeRank, solveCountByUser);
});
