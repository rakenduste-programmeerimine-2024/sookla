import { useEffect, useRef, useState } from "react";
import { Button } from "../ui/button";

interface UserFilterProps {
  onFilterChange: (selected: string[]) => void;
  isLoggedIn: boolean;
}

export default function UserFilter({ onFilterChange }: UserFilterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);
  //const dropdownRef = useRef<HTMLDivElement>(null);

  const handleFilterSelect = (filter: string, checked: boolean) => {
    let updatedFilters = [...selectedFilters];

    if (checked) {
      if (!updatedFilters.includes(filter)) {
        updatedFilters.push(filter);
      }
    } else {
      updatedFilters = updatedFilters.filter((item) => item !== filter);
    }

    console.log("Selected Filters:", updatedFilters);
    setSelectedFilters(updatedFilters);
    onFilterChange(updatedFilters);
  };

  // useEffect(() => {
  //   const handleClickOutside = (event: MouseEvent) => {
  //     if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
  //       setIsOpen(false);
  //     }
  //   };

  //   document.addEventListener("mousedown", handleClickOutside);
  //   return () => {
  //     document.removeEventListener("mousedown", handleClickOutside);
  //   };
  // }, []);

  const toggleDropdown = () => {
    //setIsOpen((prev) => !prev);
    setIsOpen(!isOpen);
  };

  //ref={dropdownRef}
  
  return (
    <div className="relative mt-20" >
      <Button onClick={toggleDropdown} size="sm" variant={"default"}>
        Vali enda filter
      </Button>

      {isOpen && (
        <div className="absolute bg-white shadow-lg rounded-lg w-56 p-4 z-10 border">
          <form>
            <div className="flex items-center mb-4">
              <input
                type="checkbox"
                id="liked"
                value="liked"
                checked={selectedFilters.includes("liked")}
                onChange={(event) =>
                  handleFilterSelect("liked", event.target.checked)
                }
                className="mr-2"
              />
              <label htmlFor="liked" className="text-black cursor-pointer">
                Meeldivad retseptid
              </label>
            </div>
            <div className="flex items-center mb-4">
              <input
                type="checkbox"
                id="followed"
                value="followed"
                checked={selectedFilters.includes("followed")}
                onChange={(event) =>
                  handleFilterSelect("followed", event.target.checked)
                }
                className="mr-2"
              />
              <label htmlFor="followed" className="text-black cursor-pointer">
                Jälgitavate kasutajate retseptid
              </label>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
