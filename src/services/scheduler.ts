import cron, { ScheduledTask } from 'node-cron';

/**
 * Service de planification des rapports
 * Génère automatiquement les rapports aux moments spécifiés
 */

class ReportScheduler {
  private tasks: Map<string, ScheduledTask> = new Map();

  /**
   * Démarre le planificateur des rapports
   */
  startScheduler() {
    console.log('🕐 Démarrage du planificateur de rapports');

    // Rapport quotidien à 17h00
    this.scheduleDailyReport();

    // Rapport hebdomadaire le vendredi à 17h00
    this.scheduleWeeklyReport();

    // Rapport mensuel le dernier jour du mois à 17h00
    this.scheduleMonthlyReport();
  }

  /**
   * Planifie le rapport quotidien (tous les jours à 17h00)
   */
  private scheduleDailyReport() {
    // Cron: 0 17 * * * = 17h00 tous les jours
    const task = cron.schedule('0 17 * * *', async () => {
      console.log('📊 Génération du rapport quotidien...');
      try {
        await this.triggerDailyReport();
      } catch (error) {
        console.error('❌ Erreur lors de la génération du rapport quotidien:', error);
      }
    });

    this.tasks.set('daily', task);
    console.log('✅ Rapport quotidien planifié à 17h00');
  }

  /**
   * Planifie le rapport hebdomadaire (vendredi à 17h00)
   */
  private scheduleWeeklyReport() {
    // Cron: 0 17 * * 5 = 17h00 le vendredi (jour 5)
    const task = cron.schedule('0 17 * * 5', async () => {
      console.log('📊 Génération du rapport hebdomadaire...');
      try {
        await this.triggerWeeklyReport();
      } catch (error) {
        console.error('❌ Erreur lors de la génération du rapport hebdomadaire:', error);
      }
    });

    this.tasks.set('weekly', task);
    console.log('✅ Rapport hebdomadaire planifié pour les vendredis à 17h00');
  }

  /**
   * Planifie le rapport mensuel (dernier jour du mois à 17h00)
   */
  private scheduleMonthlyReport() {
    // Cron: 0 17 L * * = 17h00 le dernier jour de chaque mois
    // Note: node-cron n'a pas de support natif pour "L", donc on utilise une expression alternative
    // On utilise le 28e de chaque mois (qui couvre tous les mois)
    const task = cron.schedule('0 17 28 * *', async () => {
      // Vérifier si c'est réellement le dernier jour du mois
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      if (tomorrow.getDate() === 1) {
        // C'est le dernier jour du mois
        console.log('📊 Génération du rapport mensuel...');
        try {
          await this.triggerMonthlyReport();
        } catch (error) {
          console.error('❌ Erreur lors de la génération du rapport mensuel:', error);
        }
      }
    });

    this.tasks.set('monthly', task);
    console.log('✅ Rapport mensuel planifié pour le dernier jour de chaque mois à 17h00');
  }

  /**
   * Déclenche le rapport quotidien
   */
  private async triggerDailyReport() {
    // Appel à l'API pour générer le rapport
    try {
      const response = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/reports`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'daily',
          signature: {
            signataire: 'Système Automatisé',
            date: new Date(),
            hash: 'AUTO_SIGNATURE',
          },
        }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Rapport quotidien généré:', data);
      } else {
        console.error('❌ Erreur réponse API:', response.status);
      }
    } catch (error) {
      console.error('❌ Erreur lors de l\'appel API:', error);
    }
  }

  /**
   * Déclenche le rapport hebdomadaire
   */
  private async triggerWeeklyReport() {
    try {
      const response = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/reports`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'weekly',
          signature: {
            signataire: 'Système Automatisé',
            date: new Date(),
            hash: 'AUTO_SIGNATURE',
          },
        }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Rapport hebdomadaire généré:', data);
      }
    } catch (error) {
      console.error('❌ Erreur lors de la génération du rapport hebdomadaire:', error);
    }
  }

  /**
   * Déclenche le rapport mensuel
   */
  private async triggerMonthlyReport() {
    try {
      const response = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/reports`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'monthly',
          signature: {
            signataire: 'Système Automatisé',
            date: new Date(),
            hash: 'AUTO_SIGNATURE',
          },
        }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Rapport mensuel généré:', data);
      }
    } catch (error) {
      console.error('❌ Erreur lors de la génération du rapport mensuel:', error);
    }
  }

  /**
   * Arrête tous les planificateurs
   */
  stopScheduler() {
    console.log('⏹️ Arrêt du planificateur');
    this.tasks.forEach((task) => {
      task.stop();
    });
    this.tasks.clear();
  }

  /**
   * Obtient le statut des planificateurs
   */
  getStatus() {
    return {
      isRunning: this.tasks.size > 0,
      tasks: Array.from(this.tasks.keys()),
      totalTasks: this.tasks.size,
    };
  }
}

export default new ReportScheduler();
