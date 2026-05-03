import { useMemo } from "react"
import "../styles/days-selector.css"

export default function DaySelector({ selectedDate, setSelectedDate }) {

const weekDays = useMemo(() => {

const days = []
const today = new Date()

for(let i = 0; i < 14; i++){

const d = new Date(today)
d.setDate(today.getDate() + i)

days.push(d)

}

return days

},[])

return (

<div className="days-selector">

{weekDays.map((day,index) => {

const isToday =
day.toDateString() === new Date().toDateString()

const isSelected =
day.toDateString() === selectedDate.toDateString()

return (

<div
key={index}
className={`day-item ${isToday ? "today" : ""} ${isSelected ? "selected" : ""}`}
onClick={() => setSelectedDate(day)}
>

<div className="day-name">
{day.toLocaleDateString("en-US",{ weekday:"short" })}
</div>

<div className="day-number">
{day.getDate()}
</div>

</div>

)

})}

</div>

)

}