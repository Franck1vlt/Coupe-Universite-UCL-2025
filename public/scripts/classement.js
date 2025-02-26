document.addEventListener('DOMContentLoaded', () => {
    loadSports();
});

async function loadSports() {
    const response = await fetch('http://localhost:3000/sports');
    const data = await response.json();
    const select = document.getElementById('sportSelect');

    data.sports.forEach(sport => {
        const option = document.createElement('option');
        option.value = sport.id;
        option.textContent = sport.nom;
        select.appendChild(option);
    });
}

async function loadClassement() {
    const sportId = document.getElementById('sportSelect').value;
    const response = await fetch(`http://localhost:3000/classement?sportId=${sportId}`);
    const data = await response.json();
    const tableBody = document.getElementById('rankingTable').querySelector('tbody');

    tableBody.innerHTML = ''; // Clear existing rows

    data.classement.forEach((ecole, index) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${index + 1}</td>
            <td>${ecole.nom}</td>
            <td>${ecole.points}</td>
            <td>${ecole.matchs_joues}</td>
        `;
        tableBody.appendChild(row);
    });
}
