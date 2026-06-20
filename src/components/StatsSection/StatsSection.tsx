import "./StatsSection.scss";

type StatItem = {
  value: string;
  label: string;
};

const stats: StatItem[] = [
  {
    value: "2M+",
    label: "Videos transcritos",
  },
  {
    value: "50+",
    label: "Idiomas soportados",
  },
  {
    value: "98.4%",
    label: "Precisión promedio",
  },
  {
    value: "<30s",
    label: "Velocidad promedio",
  },
];

export default function StatsSection() {
  return (
    <section className="statsSection" aria-label="Estadísticas">
      <div className="statsSection__content">
        {stats.map((stat) => (
          <div className="statsSection__item" key={stat.label}>
            <strong className="statsSection__value">{stat.value}</strong>
            <span className="statsSection__label">{stat.label}</span>
          </div>
        ))}
      </div>
    </section>
  );
}