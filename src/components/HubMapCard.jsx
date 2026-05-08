import ethMap from '../assets/eth.png'

function HubMapCard() {
  return (
    <article className="panel">
      <h2>20 hubs nationwide</h2>

      <div className="map-placeholder">
        <img src={ethMap} alt="Ethiopia hub coverage map" className="hub-map-image" />
      </div>
    </article>
  )
}

export default HubMapCard
