import { useNavigate } from 'react-router-dom'
import { Navbar } from 'react-bootstrap'
import { ROUTE_HOME } from '../resources/routes'
import iconNobg from '../assets/icon-nobg.png'

export default function AboutPage() {
  const navigate = useNavigate()

  return (
    <div className="about-layout">
      <Navbar fixed="top" bg="dark" variant="dark" className="bo-navbar">
        <button className="bo-back-btn" onClick={() => navigate(ROUTE_HOME)}>←</button>
        <Navbar.Brand className="bo-brand">Sobre el proyecto</Navbar.Brand>
      </Navbar>

      <div className="about-body">
        <div className="about-hero">
          <img src={iconNobg} alt="" className="about-hero-icon" aria-hidden="true" />
          <h1 className="about-hero-title">El Toponomicón</h1>
          <p className="about-hero-sub">
            Una herramienta para explorar la toponimia de Cantabria
            en sus dimensiones geográfica e histórica.
          </p>
        </div>

        <div className="about-content">

          <section className="about-section">
            <p className="about-lead">
              Esta herramienta está pensada para explorar la toponimia de Cantabria en dos
              dimensiones: la <strong>geográfica</strong>, observando la distribución de cierto
              topónimo con sus variantes; y la <strong>histórica</strong>, observando la evolución
              de los topónimos a lo largo de los siglos a través de sus atestiguaciones gráficas.
            </p>
            <p>
              También existe una clara intención de puesta en valor y dignificación de la
              toponimia tradicional, como herramienta indispensable para cualquier persona
              interesada en la dialectología y la lingüística histórica.
            </p>
            <p>
              Se irán añadiendo topónimos a medida que se vayan encontrando. El objetivo no
              es un mapa exhaustivo, sino un mapa de los topónimos con valor singular, aunque
              no sean raros. Por ejemplo, <em>Llama</em> es muy común en Cantabria, pero
              presenta características evolutivas que hacen interesante representarlo en un
              mapa. <em>Vega</em>, en cambio, es igualmente frecuente, pero no presenta
              rasgos particulares en Cantabria que justifiquen su inclusión.
            </p>
          </section>

          <section className="about-section">
            <h2 className="about-h2">Sobre los datos</h2>

            <h3 className="about-h3">Fuentes</h3>
            <p>
              Se prescribirán las formas más conservadoras atestiguables. Las fuentes
              de referencia tendrán preferencia sobre los usos casuales: aunque existan
              mil referencias a una forma en Google, se preferirá una única referencia
              extraída de una obra especializada en toponimia.
            </p>
            <p>
              Cuando un topónimo no difiera significativamente de su forma oficial, no
              se recogerán atestaciones históricas más allá de la fecha de
              estandarización, momento en que el topónimo se incorporó a la cartografía
              oficial.
            </p>

            <h3 className="about-h3">Grafía</h3>
            <p>
              Este proyecto establece un compromiso entre la ortografía de la Academia de
              la Llingua Asturiana y la de la Real Academia Española para las soluciones
              vernáculas:
            </p>
            <ul className="about-rules">
              <li>
                Se prescribe el uso de la <strong>ḥ</strong> (hache sopunteada) para las
                aspiraciones resultado de F latina: <em>ḥuegu</em> &lt; <span className="about-latin">FOCUM</span>.
              </li>
              <li>
                Se adoptan las grafías castellanas para los resultados que producen velares
                o aspiradas no provenientes de F latina: <em>hiju</em> &lt; <span className="about-latin">FILIUM</span>,{' '}
                <em>hoja</em> &lt; <span className="about-latin">FOLIAM</span>.
              </li>
              <li>
                Se preferirán formas no armonizadas cuando puedan recomponerse siguiendo
                procesos meramente fonológicos: <em>Colina</em> y no <em>*Culina</em>;{' '}
                <em>Ḥeniru</em> y no <em>Ḥiniru</em> &lt; <span className="about-latin">FAENARIUM</span>.
              </li>
              <li>
                Los sustantivos masculinos se marcarán con <strong>-u</strong> cuando sea
                pertinente: <em>riu</em> y no <em>río</em>.
              </li>
            </ul>

            <h3 className="about-h3">Regularización de grafías históricas</h3>
            <p>
              Se corrigen las grafías oficiales que son históricamente inconsistentes con
              las convenciones habituales:
            </p>
            <ul className="about-rules">
              <li>
                Se generaliza el uso de H para resultados de la pérdida de F:{' '}
                <em>Hontaneda</em>, <em>Hontón</em> — ambos de <span className="about-latin">FONTE</span> — o <em>Hesles</em>{' '}
                — de <span className="about-latin">FISTOLES</span>.
              </li>
              <li>
                Se separan las locuciones cuando es pertinente: <em>El Castru
                Valnera</em> y no <em>*Castrovalnera</em>; <em>La Porra Colina</em> y no{' '}
                <em>*Porracolina</em>.
              </li>
              <li>
                Se recomponen palabras cuando es pertinente: <em>Losal</em> y no{' '}
                <em>*El Osal</em>.
              </li>
              <li>
                Se regularizarán topónimos grafiados con yeísmo: <em>Llera</em> y no{' '}
                <em>*Yera</em>; <em>Llagu</em> y no <em>*Yago</em>.
              </li>
            </ul>
          </section>

          <section className="about-section about-section--author">
            <h2 className="about-h2">El autor</h2>
            <p>
              Proyecto creado por <strong>Manuel Moreno Carral</strong> usando{' '}
              <a href="https://claude.ai/code" target="_blank" rel="noreferrer">Claude Code</a>.
            </p>
            <p>
              Manuel (Selaya, 1989) es ingeniero en Informática por la Universidad de
              Cantabria y máster en Lingüística Teórica por la Universitat Pompeu Fabra.
            </p>
          </section>

          <section className="about-section about-section--contact">
            <h2 className="about-h2">Contacto</h2>
            <p>
              Si te gusta la toponimia tanto como a mí, o quieres ayudarme a incorporar
              topónimos a la base de datos, contáctame en{' '}
              <a href="https://twitter.com/morecar89" target="_blank" rel="noreferrer">
                Twitter @morecar89
              </a>{' '}
              o por email (el mismo nombre, en Gmail).
            </p>
            <p className="about-links">
              <a href="https://es.linkedin.com/in/morecar/en" target="_blank" rel="noreferrer">LinkedIn</a>
              {' · '}
              <a href="https://github.com/morecar" target="_blank" rel="noreferrer">GitHub</a>
            </p>
          </section>

        </div>
      </div>
    </div>
  )
}
