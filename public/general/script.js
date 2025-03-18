async function updateGeneralRanking() {
    try {
        // Récupérer les points de tous les sports
        const response = await fetch('/api/rankings/general');
        const data = await response.json();
        
        const rankingTable = document.getElementById('generalRanking');
        rankingTable.innerHTML = ''; // Nettoyer le tableau

        // Trier par points totaux
        const rankings = data.rankings.sort((a, b) => b.total_points - a.total_points);

        rankings.forEach((team, index) => {
            const row = `
                <tr>
                    <td>${index + 1}</td>
                    <td>${team.nom_equipe}</td>
                    <td>${team.foot_points || 0}</td>
                    <td>${team.handball_points || 0}</td>
                    <td>${team.basket_points || 0}</td>
                    <td>${team.volley_h_points || 0}</td>
                    <td>${team.volley_f_points || 0}</td>
                    <td>${team.badminton_points || 0}</td>
                    <td>${team.petanque_points || 0}</td>
                    <td>${team.flechettes_points || 0}</td>
                    <td>${team.ambiance_points || 0}</td>
                    <td>${team.route150_points || 0}</td>
                    <td class="total-points">${team.total_points || 0}</td>
                </tr>`;
            rankingTable.innerHTML += row;
        });
    } catch (error) {
        console.error('Erreur lors de la mise à jour du classement:', error);
    }
}

// Mettre à jour le classement toutes les 30 secondes
setInterval(updateGeneralRanking, 30000);

// Mise à jour initiale
document.addEventListener('DOMContentLoaded', updateGeneralRanking);
